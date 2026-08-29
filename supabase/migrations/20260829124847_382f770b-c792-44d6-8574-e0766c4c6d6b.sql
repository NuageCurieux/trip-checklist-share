CREATE TABLE public.visited_places (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_place_id uuid NOT NULL REFERENCES public.catalog_places(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_place_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.visited_places TO authenticated;
GRANT ALL ON public.visited_places TO service_role;

ALTER TABLE public.visited_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own visited places"
ON public.visited_places FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());