
-- Fix: Scope lesson-materials access to enrolled students / class teachers
DROP POLICY IF EXISTS "Teachers can read lesson materials" ON storage.objects;

CREATE POLICY "Edu staff can read lesson materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_edu_role(auth.uid(), 'admin'::edu_role)
    OR has_edu_role(auth.uid(), 'education_management'::edu_role)
  )
);

CREATE POLICY "Teachers read own class lesson materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  AND has_edu_role(auth.uid(), 'teacher'::edu_role)
  AND EXISTS (
    SELECT 1 FROM public.lesson_materials lm
    JOIN public.classes c ON c.id = lm.class_id
    WHERE c.teacher_id = auth.uid()
      AND (lm.file_url LIKE '%' || storage.objects.name
           OR lm.file_url LIKE '%' || storage.objects.name || '?%')
  )
);

CREATE POLICY "Students read enrolled class lesson materials"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-materials'
  AND has_edu_role(auth.uid(), 'student'::edu_role)
  AND EXISTS (
    SELECT 1 FROM public.lesson_materials lm
    JOIN public.enrollments e ON e.class_id = lm.class_id
    WHERE e.student_id = auth.uid()
      AND e.status = 'active'
      AND (lm.file_url LIKE '%' || storage.objects.name
           OR lm.file_url LIKE '%' || storage.objects.name || '?%')
  )
);

-- Fix: Scope lesson-videos reads to enrolled students / course admins
DROP POLICY IF EXISTS "Authenticated read lesson videos" ON storage.objects;

CREATE POLICY "Course admins read lesson videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-videos'
  AND is_course_admin(auth.uid())
);

CREATE POLICY "Enrolled students read lesson videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-videos'
  AND (
    EXISTS (
      SELECT 1
      FROM public.course_lessons cl
      JOIN public.course_modules cm ON cm.id = cl.module_id
      JOIN public.course_levels lv ON lv.id = cm.level_id
      JOIN public.course_enrollments ce ON ce.course_id = lv.course_id
      WHERE ce.student_id = auth.uid()
        AND (storage.foldername(storage.objects.name))[1] = 'lessons'
        AND (storage.foldername(storage.objects.name))[2] = cl.id::text
    )
    OR EXISTS (
      SELECT 1
      FROM public.course_modules cm
      JOIN public.course_levels lv ON lv.id = cm.level_id
      JOIN public.course_enrollments ce ON ce.course_id = lv.course_id
      WHERE ce.student_id = auth.uid()
        AND (storage.foldername(storage.objects.name))[1] = 'modules'
        AND (storage.foldername(storage.objects.name))[2] = cm.id::text
    )
  )
);
