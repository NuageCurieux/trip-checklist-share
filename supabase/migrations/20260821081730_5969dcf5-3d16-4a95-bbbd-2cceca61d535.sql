-- Minimal, non-sensitive info about a shared notebook so a visitor without access
-- can find the traveller's public profile and request access.
CREATE OR REPLACE FUNCTION public.share_gate_info(_slug text)
RETURNS TABLE (
  title text,
  destination text,
  owner_handle text,
  owner_name text,
  unlocked boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.title,
    t.destination,
    pr.handle,
    pr.display_name,
    public.can_view_trip(t.id)
  FROM public.trips t
  LEFT JOIN public.profiles pr ON pr.id = t.owner_id
  WHERE t.share_slug = _slug
    AND t.visibility <> 'private'
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.share_gate_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.share_gate_info(text) TO anon, authenticated;