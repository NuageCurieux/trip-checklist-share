CREATE TABLE public.day_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  country text NOT NULL,
  city text NOT NULL,
  title text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_plans TO authenticated;
GRANT ALL ON public.day_plans TO service_role;
ALTER TABLE public.day_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Travellers manage their own day plans" ON public.day_plans
  FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE TRIGGER day_plans_updated_at BEFORE UPDATE ON public.day_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.day_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.day_plans(id) ON DELETE CASCADE,
  catalog_place_id uuid NOT NULL REFERENCES public.catalog_places(id) ON DELETE CASCADE,
  slot text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.day_plan_items TO authenticated;
GRANT ALL ON public.day_plan_items TO service_role;
ALTER TABLE public.day_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Travellers manage items of their own day plans" ON public.day_plan_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = plan_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = plan_id AND p.owner_id = auth.uid()));

CREATE INDEX day_plan_items_plan_idx ON public.day_plan_items (plan_id, position);