-- 1. Public traveller profiles (bio-link page)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 60),
  bio text CHECK (bio IS NULL OR char_length(bio) <= 300),
  instagram text CHECK (instagram IS NULL OR char_length(instagram) <= 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are publicly readable" ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users create their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users delete their own profile" ON public.profiles
  FOR DELETE TO authenticated USING (id = auth.uid());

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Access requests: followers ask, the traveller approves
CREATE TABLE public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_name text CHECK (viewer_name IS NULL OR char_length(viewer_name) <= 60),
  instagram text CHECK (instagram IS NULL OR char_length(instagram) <= 40),
  message text CHECK (message IS NULL OR char_length(message) <= 300),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE (owner_id, viewer_id),
  CHECK (owner_id <> viewer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Viewers create their own pending request" ON public.access_requests
  FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid() AND status = 'pending' AND owner_id <> auth.uid());
CREATE POLICY "Owner and viewer read the request" ON public.access_requests
  FOR SELECT TO authenticated USING (owner_id = auth.uid() OR viewer_id = auth.uid());
CREATE POLICY "Owners decide on requests" ON public.access_requests
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner or viewer removes the request" ON public.access_requests
  FOR DELETE TO authenticated USING (owner_id = auth.uid() OR viewer_id = auth.uid());

-- 3. Access helper + gate shared notebooks behind approval
CREATE OR REPLACE FUNCTION public.has_follower_access(_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    _owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.access_requests r
      WHERE r.owner_id = _owner_id
        AND r.viewer_id = auth.uid()
        AND r.status = 'approved'
    )
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_follower_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_follower_access(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_view_trip(_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = _trip_id
      AND (
        t.owner_id = auth.uid()
        OR (t.visibility = 'public' AND public.has_follower_access(t.owner_id))
        OR (
          t.visibility = 'friends'
          AND EXISTS (
            SELECT 1 FROM public.trip_members m
            WHERE m.trip_id = t.id
              AND lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
          )
        )
      )
  )
$$;

-- 4. Locked previews for the public bio-link page (no places, no documents)
CREATE OR REPLACE FUNCTION public.profile_trip_previews(_handle text)
RETURNS TABLE (
  id uuid,
  title text,
  destination text,
  cover_path text,
  cover_url text,
  share_slug text,
  place_count integer,
  unlocked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.title,
    t.destination,
    t.cover_path,
    t.cover_url,
    CASE WHEN public.has_follower_access(t.owner_id) THEN t.share_slug ELSE NULL END,
    (SELECT count(*)::int FROM public.places p WHERE p.trip_id = t.id),
    public.has_follower_access(t.owner_id)
  FROM public.trips t
  JOIN public.profiles pr ON pr.id = t.owner_id
  WHERE lower(pr.handle) = lower(_handle)
    AND t.visibility = 'public'
  ORDER BY t.created_at DESC
$$;

REVOKE EXECUTE ON FUNCTION public.profile_trip_previews(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_trip_previews(text) TO anon, authenticated;

-- 5. Notifications for the access flow
CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.owner_id,
    'access_requested',
    'access_requested',
    coalesce(NEW.instagram, NEW.viewer_name, ''),
    '/acces'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_access_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      NEW.viewer_id,
      'access_' || NEW.status,
      'access_' || NEW.status,
      NULL,
      '/'
    );
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_access_request() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_access_reviewed() FROM PUBLIC;

CREATE TRIGGER access_requests_notify_created AFTER INSERT ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request();
CREATE TRIGGER access_requests_notify_reviewed AFTER UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_reviewed();

CREATE OR REPLACE FUNCTION public.set_access_reviewed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_access_reviewed_at() FROM PUBLIC;

CREATE TRIGGER access_requests_reviewed_at BEFORE UPDATE ON public.access_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_access_reviewed_at();