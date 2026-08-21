-- Only used inside signed-in policies: anonymous callers never need it
REVOKE ALL ON FUNCTION public.is_trip_owner(uuid) FROM anon;

-- Called only from inside other SECURITY DEFINER helpers, never from the API
REVOKE ALL ON FUNCTION public.has_follower_access(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
