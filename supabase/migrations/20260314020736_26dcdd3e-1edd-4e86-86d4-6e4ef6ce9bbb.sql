
-- Create security definer functions to break circular RLS references

-- Check if user is teacher of a class (avoids hitting classes RLS)
CREATE OR REPLACE FUNCTION public.is_teacher_of_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = _class_id AND teacher_id = _user_id
  )
$$;

-- Check if user is enrolled in a class (avoids hitting enrollments RLS)
CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE class_id = _class_id AND student_id = _user_id AND status = 'active'
  )
$$;

-- Check if user is a student in any class taught by teacher (for profiles)
CREATE OR REPLACE FUNCTION public.is_student_of_teacher(_student_id uuid, _teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.classes c ON c.id = e.class_id
    WHERE e.student_id = _student_id AND c.teacher_id = _teacher_id
  )
$$;

-- Fix classes policies: remove direct enrollments reference
DROP POLICY IF EXISTS "Students can read enrolled classes" ON public.classes;
CREATE POLICY "Students can read enrolled classes" ON public.classes
FOR SELECT TO authenticated
USING (is_enrolled_in_class(auth.uid(), id));

DROP POLICY IF EXISTS "Teachers can read own classes" ON public.classes;
CREATE POLICY "Teachers can read own classes" ON public.classes
FOR SELECT TO authenticated
USING (teacher_id = auth.uid());

-- Fix enrollments policies: remove direct classes reference  
DROP POLICY IF EXISTS "Teachers can read enrollments for own classes" ON public.enrollments;
CREATE POLICY "Teachers can read enrollments for own classes" ON public.enrollments
FOR SELECT TO authenticated
USING (is_teacher_of_class(auth.uid(), class_id));

-- Fix attendance policies
DROP POLICY IF EXISTS "Teachers can manage attendance for own classes" ON public.attendance;
CREATE POLICY "Teachers can manage attendance for own classes" ON public.attendance
FOR ALL TO authenticated
USING (is_teacher_of_class(auth.uid(), class_id))
WITH CHECK (is_teacher_of_class(auth.uid(), class_id));

-- Fix assignments policies
DROP POLICY IF EXISTS "Teachers can manage assignments for own classes" ON public.assignments;
CREATE POLICY "Teachers can manage assignments for own classes" ON public.assignments
FOR ALL TO authenticated
USING (is_teacher_of_class(auth.uid(), class_id))
WITH CHECK (is_teacher_of_class(auth.uid(), class_id));

DROP POLICY IF EXISTS "Students can read assignments for enrolled classes" ON public.assignments;
CREATE POLICY "Students can read assignments for enrolled classes" ON public.assignments
FOR SELECT TO authenticated
USING (is_enrolled_in_class(auth.uid(), class_id));

-- Fix announcements policies
DROP POLICY IF EXISTS "Teachers can manage announcements for own classes" ON public.announcements;
CREATE POLICY "Teachers can manage announcements for own classes" ON public.announcements
FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'teacher'::edu_role) AND (created_by = auth.uid() OR is_teacher_of_class(auth.uid(), class_id)))
WITH CHECK (has_edu_role(auth.uid(), 'teacher'::edu_role) AND is_teacher_of_class(auth.uid(), class_id));

DROP POLICY IF EXISTS "Students can read relevant announcements" ON public.announcements;
CREATE POLICY "Students can read relevant announcements" ON public.announcements
FOR SELECT TO authenticated
USING (
  audience_role = 'student'::edu_role 
  OR audience_role IS NULL 
  OR (class_id IS NOT NULL AND is_enrolled_in_class(auth.uid(), class_id))
);

-- Fix lesson_materials policies
DROP POLICY IF EXISTS "Teachers can manage materials for own classes" ON public.lesson_materials;
CREATE POLICY "Teachers can manage materials for own classes" ON public.lesson_materials
FOR ALL TO authenticated
USING (is_teacher_of_class(auth.uid(), class_id))
WITH CHECK (is_teacher_of_class(auth.uid(), class_id));

DROP POLICY IF EXISTS "Students can read materials for enrolled classes" ON public.lesson_materials;
CREATE POLICY "Students can read materials for enrolled classes" ON public.lesson_materials
FOR SELECT TO authenticated
USING (is_enrolled_in_class(auth.uid(), class_id));

-- Fix profiles policies: remove direct join to enrollments/classes
DROP POLICY IF EXISTS "Teachers can read student profiles in their classes" ON public.profiles;
CREATE POLICY "Teachers can read student profiles in their classes" ON public.profiles
FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'teacher'::edu_role) AND is_student_of_teacher(id, auth.uid()));

-- Fix submissions policies
DROP POLICY IF EXISTS "Teachers can read submissions for own classes" ON public.submissions;
CREATE POLICY "Teachers can read submissions for own classes" ON public.submissions
FOR SELECT TO authenticated
USING (is_teacher_of_class(auth.uid(), (SELECT class_id FROM public.assignments WHERE id = submissions.assignment_id)));

-- Fix grades policies
DROP POLICY IF EXISTS "Teachers can manage grades for own class submissions" ON public.grades;
CREATE POLICY "Teachers can manage grades for own class submissions" ON public.grades
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.submissions s
  JOIN public.assignments a ON a.id = s.assignment_id
  WHERE s.id = grades.submission_id AND is_teacher_of_class(auth.uid(), a.class_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.submissions s
  JOIN public.assignments a ON a.id = s.assignment_id
  WHERE s.id = grades.submission_id AND is_teacher_of_class(auth.uid(), a.class_id)
));
