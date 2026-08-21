REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_suggestion_created() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_suggestion_reviewed() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_suggestion_consensus() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_place_suggestion(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_location_share(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_location_share(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_trip_owner(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_view_trip(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_place_suggestion(uuid, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.owns_location_share(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_location_share(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_trip(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_place_suggestion(uuid, boolean) TO authenticated;