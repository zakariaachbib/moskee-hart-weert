
-- Announcements: remove NULL audience_role catch-all for students
DROP POLICY IF EXISTS "Students can read relevant announcements" ON public.announcements;
CREATE POLICY "Students can read relevant announcements"
ON public.announcements
FOR SELECT
USING (
  has_edu_role(auth.uid(), 'student'::edu_role)
  AND (
    audience_role = 'student'::edu_role
    OR (class_id IS NOT NULL AND is_enrolled_in_class(auth.uid(), class_id))
  )
);

-- Course levels: restrict to enrolled students and course admins
DROP POLICY IF EXISTS "Anyone can read levels of published courses" ON public.course_levels;
CREATE POLICY "Enrolled users can read course levels"
ON public.course_levels
FOR SELECT
USING (
  is_course_admin(auth.uid())
  OR is_enrolled_in_course(auth.uid(), course_id)
);

-- Course modules: restrict to enrolled students and course admins
DROP POLICY IF EXISTS "Anyone can read modules" ON public.course_modules;
CREATE POLICY "Enrolled users can read course modules"
ON public.course_modules
FOR SELECT
USING (
  is_course_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.course_levels cl
    WHERE cl.id = course_modules.level_id
      AND is_enrolled_in_course(auth.uid(), cl.course_id)
  )
);
