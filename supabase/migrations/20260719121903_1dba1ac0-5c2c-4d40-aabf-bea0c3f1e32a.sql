
-- academic_events: restrict to edu roles
DROP POLICY IF EXISTS "Authenticated can read events" ON public.academic_events;
CREATE POLICY "Edu users can read events"
ON public.academic_events
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_edu_role(auth.uid(), 'admin'::edu_role)
  OR public.has_edu_role(auth.uid(), 'education_management'::edu_role)
  OR public.has_edu_role(auth.uid(), 'teacher'::edu_role)
  OR public.has_edu_role(auth.uid(), 'student'::edu_role)
);

-- academic_terms: restrict to edu roles
DROP POLICY IF EXISTS "Anyone authenticated can read academic terms" ON public.academic_terms;
CREATE POLICY "Edu users can read academic terms"
ON public.academic_terms
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_edu_role(auth.uid(), 'admin'::edu_role)
  OR public.has_edu_role(auth.uid(), 'education_management'::edu_role)
  OR public.has_edu_role(auth.uid(), 'teacher'::edu_role)
  OR public.has_edu_role(auth.uid(), 'student'::edu_role)
);

-- course_badges: only for published courses (admins bypass via separate policy if any)
DROP POLICY IF EXISTS "Anyone can read badges" ON public.course_badges;
CREATE POLICY "Badges visible for published courses"
ON public.course_badges
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_badges.course_id AND c.is_published = true
  )
);
