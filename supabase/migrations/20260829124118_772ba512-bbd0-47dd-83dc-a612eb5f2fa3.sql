-- Restrict collaborative writes on shared day plans to the owner and approved followers.
DROP POLICY IF EXISTS "Signed-in travellers edit shared day plans" ON public.day_plans;

CREATE POLICY "Approved travellers edit shared day plans"
ON public.day_plans
FOR UPDATE
TO authenticated
USING (shared = true AND public.has_follower_access(owner_id))
WITH CHECK (shared = true AND public.has_follower_access(owner_id));

DROP POLICY IF EXISTS "Signed-in travellers add steps to shared plans" ON public.day_plan_items;
DROP POLICY IF EXISTS "Signed-in travellers update steps of shared plans" ON public.day_plan_items;
DROP POLICY IF EXISTS "Signed-in travellers remove steps of shared plans" ON public.day_plan_items;

CREATE POLICY "Approved travellers add steps to shared plans"
ON public.day_plan_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.day_plans p
    WHERE p.id = day_plan_items.plan_id
      AND p.shared = true
      AND public.has_follower_access(p.owner_id)
  )
);

CREATE POLICY "Approved travellers update steps of shared plans"
ON public.day_plan_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.day_plans p
    WHERE p.id = day_plan_items.plan_id
      AND p.shared = true
      AND public.has_follower_access(p.owner_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.day_plans p
    WHERE p.id = day_plan_items.plan_id
      AND p.shared = true
      AND public.has_follower_access(p.owner_id)
  )
);

CREATE POLICY "Approved travellers remove steps of shared plans"
ON public.day_plan_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.day_plans p
    WHERE p.id = day_plan_items.plan_id
      AND p.shared = true
      AND public.has_follower_access(p.owner_id)
  )
);