-- Enable uploads/management for edu-documents bucket for superadmins and onderwijsbeheer
DROP POLICY IF EXISTS "Admins and education management can upload edu documents" ON storage.objects;
CREATE POLICY "Admins and education management can upload edu documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'edu-documents'
  AND (
    has_role(auth.uid(), 'admin'::public.app_role)
    OR has_edu_role(auth.uid(), 'admin'::public.edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::public.edu_role)
  )
);

DROP POLICY IF EXISTS "Admins and education management can update edu documents" ON storage.objects;
CREATE POLICY "Admins and education management can update edu documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'edu-documents'
  AND (
    has_role(auth.uid(), 'admin'::public.app_role)
    OR has_edu_role(auth.uid(), 'admin'::public.edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::public.edu_role)
  )
)
WITH CHECK (
  bucket_id = 'edu-documents'
  AND (
    has_role(auth.uid(), 'admin'::public.app_role)
    OR has_edu_role(auth.uid(), 'admin'::public.edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::public.edu_role)
  )
);

DROP POLICY IF EXISTS "Admins and education management can delete edu documents" ON storage.objects;
CREATE POLICY "Admins and education management can delete edu documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'edu-documents'
  AND (
    has_role(auth.uid(), 'admin'::public.app_role)
    OR has_edu_role(auth.uid(), 'admin'::public.edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::public.edu_role)
  )
);

-- Read access for all onderwijsrollen + superadmin
DROP POLICY IF EXISTS "Onderwijsrollen kunnen edu documents lezen" ON storage.objects;
CREATE POLICY "Onderwijsrollen kunnen edu documents lezen"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'edu-documents'
  AND (
    has_role(auth.uid(), 'admin'::public.app_role)
    OR has_edu_role(auth.uid(), 'admin'::public.edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::public.edu_role)
    OR has_edu_role(auth.uid(), 'teacher'::public.edu_role)
    OR has_edu_role(auth.uid(), 'student'::public.edu_role)
  )
);