DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;

CREATE POLICY "Public profiles are readable"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (is_public = true);

CREATE POLICY "Users read their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());