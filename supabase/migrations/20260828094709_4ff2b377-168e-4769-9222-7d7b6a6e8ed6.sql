ALTER TABLE public.day_plans
  ADD COLUMN IF NOT EXISTS planned_date date,
  ADD COLUMN IF NOT EXISTS done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT true;

DROP POLICY IF EXISTS "Travellers manage their own day plans" ON public.day_plans;

CREATE POLICY "Owners manage their day plans"
ON public.day_plans FOR ALL TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Signed-in travellers read shared day plans"
ON public.day_plans FOR SELECT TO authenticated
USING (shared = true);

CREATE POLICY "Signed-in travellers edit shared day plans"
ON public.day_plans FOR UPDATE TO authenticated
USING (shared = true)
WITH CHECK (shared = true);

DROP POLICY IF EXISTS "Travellers manage items of their own day plans" ON public.day_plan_items;

CREATE POLICY "Owners manage items of their day plans"
ON public.day_plan_items FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.owner_id = auth.uid()));

CREATE POLICY "Signed-in travellers read shared plan items"
ON public.day_plan_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.shared = true));

CREATE POLICY "Signed-in travellers add steps to shared plans"
ON public.day_plan_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.shared = true));

CREATE POLICY "Signed-in travellers update steps of shared plans"
ON public.day_plan_items FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.shared = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.shared = true));

CREATE POLICY "Signed-in travellers remove steps of shared plans"
ON public.day_plan_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.day_plans p WHERE p.id = day_plan_items.plan_id AND p.shared = true));