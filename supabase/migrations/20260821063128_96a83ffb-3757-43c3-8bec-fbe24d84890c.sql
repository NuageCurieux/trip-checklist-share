ALTER TABLE public.places ADD COLUMN photo_path text;
ALTER TABLE public.trips ADD COLUMN cover_path text;

CREATE POLICY "Anyone can read voyage photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'voyages');
CREATE POLICY "Users upload their own voyage photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voyages' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update their own voyage photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'voyages' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete their own voyage photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'voyages' AND (storage.foldername(name))[1] = auth.uid()::text);