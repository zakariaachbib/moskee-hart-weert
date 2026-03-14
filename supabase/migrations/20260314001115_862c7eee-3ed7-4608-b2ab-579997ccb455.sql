
-- =============================================
-- MIGRATION 4: RLS Policies for ALL education tables
-- =============================================

-- ========== edu_user_roles ==========
CREATE POLICY "Users can read own edu role"
  ON public.edu_user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all edu roles"
  ON public.edu_user_roles FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

-- ========== profiles ==========
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admin can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can read student profiles in their classes"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.has_edu_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.enrollments e
      JOIN public.classes c ON c.id = e.class_id
      WHERE e.student_id = profiles.id AND c.teacher_id = auth.uid()
    )
  );

-- ========== academic_terms ==========
CREATE POLICY "Anyone authenticated can read academic terms"
  ON public.academic_terms FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage academic terms"
  ON public.academic_terms FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

-- ========== classes ==========
CREATE POLICY "Admin can manage all classes"
  ON public.classes FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all classes"
  ON public.classes FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can read own classes"
  ON public.classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read enrolled classes"
  ON public.classes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE class_id = classes.id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ========== enrollments ==========
CREATE POLICY "Admin can manage all enrollments"
  ON public.enrollments FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can read enrollments for own classes"
  ON public.enrollments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = enrollments.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read own enrollments"
  ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- ========== lesson_materials ==========
CREATE POLICY "Admin can manage all lesson materials"
  ON public.lesson_materials FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all lesson materials"
  ON public.lesson_materials FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can manage materials for own classes"
  ON public.lesson_materials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = lesson_materials.class_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = lesson_materials.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read materials for enrolled classes"
  ON public.lesson_materials FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE class_id = lesson_materials.class_id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ========== assignments ==========
CREATE POLICY "Admin can manage all assignments"
  ON public.assignments FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all assignments"
  ON public.assignments FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can manage assignments for own classes"
  ON public.assignments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = assignments.class_id AND teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = assignments.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read assignments for enrolled classes"
  ON public.assignments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE class_id = assignments.class_id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ========== submissions ==========
CREATE POLICY "Admin can read all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all submissions"
  ON public.submissions FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can read submissions for own classes"
  ON public.submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.classes c ON c.id = a.class_id
      WHERE a.id = submissions.assignment_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can manage own submissions"
  ON public.submissions FOR ALL TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ========== grades ==========
CREATE POLICY "Admin can read all grades"
  ON public.grades FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all grades"
  ON public.grades FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can manage grades for own class submissions"
  ON public.grades FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.classes c ON c.id = a.class_id
      WHERE s.id = grades.submission_id AND c.teacher_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.classes c ON c.id = a.class_id
      WHERE s.id = grades.submission_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read own grades"
  ON public.grades FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = grades.submission_id AND student_id = auth.uid()
    )
  );

-- ========== announcements ==========
CREATE POLICY "Admin can manage all announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read all announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

CREATE POLICY "Teachers can manage announcements for own classes"
  ON public.announcements FOR ALL TO authenticated
  USING (
    public.has_edu_role(auth.uid(), 'teacher')
    AND (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.classes
        WHERE id = announcements.class_id AND teacher_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    public.has_edu_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.classes
      WHERE id = announcements.class_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read relevant announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (
    audience_role = 'student'
    OR audience_role IS NULL
    OR EXISTS (
      SELECT 1 FROM public.enrollments
      WHERE class_id = announcements.class_id AND student_id = auth.uid() AND status = 'active'
    )
  );

-- ========== notifications ==========
CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ========== activity_logs ==========
CREATE POLICY "Admin can read all activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));

-- ========== reports ==========
CREATE POLICY "Admin can manage all reports"
  ON public.reports FOR ALL TO authenticated
  USING (public.has_edu_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_edu_role(auth.uid(), 'admin'));

CREATE POLICY "Education management can read reports"
  ON public.reports FOR SELECT TO authenticated
  USING (public.has_edu_role(auth.uid(), 'education_management'));
