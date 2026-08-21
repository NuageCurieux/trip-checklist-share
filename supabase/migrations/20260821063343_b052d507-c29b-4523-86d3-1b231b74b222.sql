CREATE TABLE public.trip_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  path text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trip_documents ADD CONSTRAINT trip_documents_kind_check CHECK (kind IN ('image','pdf'));
CREATE INDEX trip_documents_trip_id_idx ON public.trip_documents(trip_id);

GRANT SELECT ON public.trip_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trip_documents TO authenticated;
GRANT ALL ON public.trip_documents TO service_role;

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documents of accessible trips" ON public.trip_documents FOR SELECT TO anon, authenticated USING (public.can_view_trip(trip_id));
CREATE POLICY "Owners add documents" ON public.trip_documents FOR INSERT TO authenticated WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Owners update documents" ON public.trip_documents FOR UPDATE TO authenticated USING (public.is_trip_owner(trip_id)) WITH CHECK (public.is_trip_owner(trip_id));
CREATE POLICY "Owners delete documents" ON public.trip_documents FOR DELETE TO authenticated USING (public.is_trip_owner(trip_id));