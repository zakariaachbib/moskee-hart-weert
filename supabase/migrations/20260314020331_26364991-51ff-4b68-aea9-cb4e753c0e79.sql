
-- Drop and recreate policies for classes to also allow app_role admin
DROP POLICY IF EXISTS "Admin can manage all classes" ON public.classes;
CREATE POLICY "Admin can manage all classes" ON public.classes
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- attendance
DROP POLICY IF EXISTS "Admin can manage all attendance" ON public.attendance;
CREATE POLICY "Admin can manage all attendance" ON public.attendance
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- enrollments
DROP POLICY IF EXISTS "Admin can manage all enrollments" ON public.enrollments;
CREATE POLICY "Admin can manage all enrollments" ON public.enrollments
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- assignments
DROP POLICY IF EXISTS "Admin can manage all assignments" ON public.assignments;
CREATE POLICY "Admin can manage all assignments" ON public.assignments
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- announcements
DROP POLICY IF EXISTS "Admin can manage all announcements" ON public.announcements;
CREATE POLICY "Admin can manage all announcements" ON public.announcements
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- edu_documents
DROP POLICY IF EXISTS "Admin can manage all documents" ON public.edu_documents;
CREATE POLICY "Admin can manage all documents" ON public.edu_documents
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- academic_events
DROP POLICY IF EXISTS "Admin can manage all events" ON public.academic_events;
CREATE POLICY "Admin can manage all events" ON public.academic_events
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- academic_terms
DROP POLICY IF EXISTS "Admin can manage academic terms" ON public.academic_terms;
CREATE POLICY "Admin can manage academic terms" ON public.academic_terms
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- edu_user_roles
DROP POLICY IF EXISTS "Admins can manage all edu roles" ON public.edu_user_roles;
CREATE POLICY "Admins can manage all edu roles" ON public.edu_user_roles
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- lesson_materials
DROP POLICY IF EXISTS "Admin can manage all lesson materials" ON public.lesson_materials;
CREATE POLICY "Admin can manage all lesson materials" ON public.lesson_materials
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- reports
DROP POLICY IF EXISTS "Admin can manage all reports" ON public.reports;
CREATE POLICY "Admin can manage all reports" ON public.reports
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- profiles: add app_role admin read/update
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;
CREATE POLICY "Admin can read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Admin can update all profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- activity_logs
DROP POLICY IF EXISTS "Admin can read all activity logs" ON public.activity_logs;
CREATE POLICY "Admin can read all activity logs" ON public.activity_logs
FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- grades
DROP POLICY IF EXISTS "Admin can read all grades" ON public.grades;
CREATE POLICY "Admin can read all grades" ON public.grades
FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));

-- submissions
DROP POLICY IF EXISTS "Admin can read all submissions" ON public.submissions;
CREATE POLICY "Admin can read all submissions" ON public.submissions
FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role) OR has_role(auth.uid(), 'admin'::app_role));
