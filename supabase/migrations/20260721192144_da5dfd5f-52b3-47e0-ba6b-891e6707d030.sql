
ALTER TABLE public.course_modules ADD COLUMN IF NOT EXISTS media_urls jsonb;

-- Storage policies for lesson-videos
CREATE POLICY "Admins upload lesson videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lesson-videos' AND public.is_course_admin(auth.uid()));

CREATE POLICY "Admins update lesson videos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'lesson-videos' AND public.is_course_admin(auth.uid()));

CREATE POLICY "Admins delete lesson videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lesson-videos' AND public.is_course_admin(auth.uid()));

CREATE POLICY "Authenticated read lesson videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lesson-videos');
