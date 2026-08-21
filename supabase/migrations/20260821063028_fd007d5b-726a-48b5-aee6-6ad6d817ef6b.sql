CREATE TABLE public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  destination text,
  cover_url text,
  visibility text NOT NULL DEFAULT 'private',
  share_slug text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trips ADD CONSTRAINT trips_visibility_check CHECK (visibility IN ('private','friends','public'));

CREATE TABLE public.places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  area text,
  category text,
  note text,
  visited boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX places_trip_id_idx ON public.places(trip_id);

CREATE TABLE public.trip_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, email)
);

GRANT SELECT ON public.trips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;

GRANT SELECT ON public.places TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT ALL ON public.places TO service_role;

GRANT SELECT, INSERT, DELETE ON public.trip_members TO authenticated;
GRANT ALL ON public.trip_members TO service_role;

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
        OR t.visibility = 'public'
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

CREATE OR REPLACE FUNCTION public.is_trip_owner(_trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.trips t WHERE t.id = _trip_id AND t.owner_id = auth.uid())
$$;

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view accessible trips" ON public.trips FOR SELECT TO anon, authenticated USING (public.can_view_trip(id));
CREATE POLICY "Owners create trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update trips" ON public.trips FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete trips" ON public.trips FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE POLICY "Anyone can view places of accessible trips" ON public.places FOR SELECT TO anon, authenticated USING (public.can_view_trip(trip_id));
CREATE POLICY "Owners create places" ON public.places FOR INSERT TO authenticated WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Owners update places" ON public.places FOR UPDATE TO authenticated USING (public.is_trip_owner(trip_id)) WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Owners delete places" ON public.places FOR DELETE TO authenticated USING (public.is_trip_owner(trip_id));

CREATE POLICY "Owners and invited friends view members" ON public.trip_members FOR SELECT TO authenticated USING (public.is_trip_owner(trip_id) OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
CREATE POLICY "Owners invite members" ON public.trip_members FOR INSERT TO authenticated WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Owners remove members" ON public.trip_members FOR DELETE TO authenticated USING (public.is_trip_owner(trip_id));