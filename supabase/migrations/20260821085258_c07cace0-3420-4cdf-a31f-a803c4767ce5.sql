-- 1. Storage: scope reads to the file owner or people allowed to view the owning trip
DROP POLICY IF EXISTS "Anyone can read voyage photos" ON storage.objects;

CREATE POLICY "Voyage files follow trip visibility"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'voyages'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.cover_path = storage.objects.name AND public.can_view_trip(t.id)
    )
    OR EXISTS (
      SELECT 1 FROM public.places p
      WHERE p.photo_path = storage.objects.name AND public.can_view_trip(p.trip_id)
    )
    OR EXISTS (
      SELECT 1 FROM public.trip_documents d
      WHERE d.path = storage.objects.name AND public.can_view_trip(d.trip_id)
    )
  )
);

-- 2. Trigger-only SECURITY DEFINER functions must not be callable through the API
REVOKE ALL ON FUNCTION public.notify_access_request() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_access_reviewed() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_access_reviewed_at() FROM anon, authenticated;

-- 3. Moderation entry point is for signed-in moderators only, never anonymous callers
REVOKE ALL ON FUNCTION public.review_place_suggestion(uuid, boolean) FROM anon;
