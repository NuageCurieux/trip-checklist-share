CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.location_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  trust_ack boolean NOT NULL DEFAULT false CHECK (trust_ack = true),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '1 hour',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_shares TO authenticated;
GRANT ALL ON public.location_shares TO service_role;
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their location shares"
ON public.location_shares FOR ALL TO authenticated
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid() AND trust_ack = true);

CREATE POLICY "Recipients read shares aimed at them"
ON public.location_shares FOR SELECT TO authenticated
USING (lower(recipient_email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

CREATE INDEX location_shares_recipient_idx ON public.location_shares (lower(recipient_email));

CREATE TRIGGER update_location_shares_updated_at
BEFORE UPDATE ON public.location_shares
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.location_shares(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  accuracy double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.location_pings TO authenticated;
GRANT ALL ON public.location_pings TO service_role;
ALTER TABLE public.location_pings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_location_share(_share_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.location_shares s
    WHERE s.id = _share_id AND s.owner_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.can_view_location_share(_share_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.location_shares s
    WHERE s.id = _share_id
      AND (
        s.owner_id = auth.uid()
        OR (
          s.status = 'active'
          AND s.expires_at > now()
          AND lower(s.recipient_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        )
      )
  )
$$;

CREATE POLICY "Owners send their own position"
ON public.location_pings FOR INSERT TO authenticated
WITH CHECK (public.owns_location_share(share_id));

CREATE POLICY "Owner and trusted friend read positions"
ON public.location_pings FOR SELECT TO authenticated
USING (public.can_view_location_share(share_id));

CREATE POLICY "Owners delete their positions"
ON public.location_pings FOR DELETE TO authenticated
USING (public.owns_location_share(share_id));

CREATE INDEX location_pings_share_idx ON public.location_pings (share_id, created_at DESC);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users update their notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete their notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_suggestion_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.created_by, 'suggestion_pending', 'suggestion_pending', NEW.field, '/corrections');
  RETURN NEW;
END;
$$;

CREATE TRIGGER place_suggestions_notify_created
AFTER INSERT ON public.place_suggestions
FOR EACH ROW EXECUTE FUNCTION public.notify_suggestion_created();

CREATE OR REPLACE FUNCTION public.notify_suggestion_reviewed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> OLD.status AND NEW.status IN ('approved','rejected') THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      NEW.created_by,
      'suggestion_' || NEW.status,
      'suggestion_' || NEW.status,
      NEW.field,
      '/corrections'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER place_suggestions_notify_reviewed
AFTER UPDATE ON public.place_suggestions
FOR EACH ROW EXECUTE FUNCTION public.notify_suggestion_reviewed();