
CREATE POLICY "Preken uploaders can insert sermons" ON public.sermons FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'preken_uploader'::app_role));
CREATE POLICY "Preken uploaders can update sermons" ON public.sermons FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'preken_uploader'::app_role));
CREATE POLICY "Preken uploaders can delete sermons" ON public.sermons FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'preken_uploader'::app_role));

CREATE POLICY "Preken uploaders can upload sermon files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'sermons' AND public.has_role(auth.uid(), 'preken_uploader'::app_role));
CREATE POLICY "Preken uploaders can delete sermon files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'sermons' AND public.has_role(auth.uid(), 'preken_uploader'::app_role));
