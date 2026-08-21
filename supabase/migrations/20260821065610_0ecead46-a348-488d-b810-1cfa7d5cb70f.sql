REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_suggestion_created() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_suggestion_reviewed() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_suggestion_consensus() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_place_suggestion(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_location_share(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_location_share(uuid) FROM anon;