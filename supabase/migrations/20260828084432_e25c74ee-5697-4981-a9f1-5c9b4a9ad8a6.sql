ALTER TABLE public.catalog_places
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS activity_group text;

CREATE INDEX IF NOT EXISTS catalog_places_activity_group_idx ON public.catalog_places (activity_group);