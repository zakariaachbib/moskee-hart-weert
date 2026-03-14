
-- Fix Security Definer Views by setting security_invoker = true
ALTER VIEW public.at_risk_students SET (security_invoker = true);
ALTER VIEW public.class_performance_summary SET (security_invoker = true);
ALTER VIEW public.management_dashboard_summary SET (security_invoker = true);

-- =============================================
-- MIGRATION 6: Storage Buckets + Policies
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-materials', 'lesson-materials', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-submissions', 'assignment-submissions', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('report-exports', 'report-exports', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- ========== Storage Policies ==========

-- lesson-materials: teachers can upload for own classes, admin can manage all
CREATE POLICY "Admin can manage lesson materials files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'lesson-materials' AND public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'lesson-materials' AND public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can upload lesson materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-materials'
    AND public.has_edu_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers can read lesson materials"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'lesson-materials'
    AND (
      public.has_edu_role(auth.uid(), 'teacher')
      OR public.has_edu_role(auth.uid(), 'education_management')
      OR public.has_edu_role(auth.uid(), 'student')
    )
  );

-- assignment-submissions: students upload own, teachers/admin read
CREATE POLICY "Admin can manage submission files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'assignment-submissions' AND public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'assignment-submissions' AND public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Students can upload own submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND public.has_edu_role(auth.uid(), 'student')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Students can read own submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND public.has_edu_role(auth.uid(), 'student')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Teachers can read submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND (
      public.has_edu_role(auth.uid(), 'teacher')
      OR public.has_edu_role(auth.uid(), 'education_management')
    )
  );

-- report-exports: admin manage, edu_management read
CREATE POLICY "Admin can manage report files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'report-exports' AND public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'report-exports' AND public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read report files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-exports'
    AND public.has_edu_role(auth.uid(), 'education_management')
  );

-- avatars: public read, authenticated users can upload own
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
