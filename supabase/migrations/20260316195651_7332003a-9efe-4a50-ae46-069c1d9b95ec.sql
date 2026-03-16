
-- ============================================
-- LMS TABLES
-- ============================================

-- Courses
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  description text,
  image_url text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course Levels
CREATE TABLE public.course_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course Modules
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.course_levels(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Course Lessons
CREATE TABLE public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  arabic_terms jsonb DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  media_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Course Quizzes
CREATE TABLE public.course_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer NOT NULL DEFAULT 80,
  is_final_exam boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Quiz Questions
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option_index integer NOT NULL DEFAULT 0,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0
);

-- Course Enrollments
CREATE TABLE public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

-- Student Lesson Progress
CREATE TABLE public.student_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, lesson_id)
);

-- Student Quiz Attempts
CREATE TABLE public.student_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.course_quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  attempted_at timestamptz NOT NULL DEFAULT now()
);

-- Course Certificates
CREATE TABLE public.course_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE UNIQUE,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now()
);

-- Course Badges
CREATE TABLE public.course_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  icon text,
  condition_type text NOT NULL DEFAULT 'complete_level',
  condition_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Student Badges
CREATE TABLE public.student_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.course_badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, badge_id)
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.is_course_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    has_role(_user_id, 'admin'::app_role)
    OR has_edu_role(_user_id, 'admin'::edu_role)
    OR has_edu_role(_user_id, 'education_management'::edu_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE student_id = _user_id AND course_id = _course_id
  )
$$;

-- ============================================
-- RLS POLICIES — COURSES (public read for published, admin CRUD)
-- ============================================
CREATE POLICY "Anyone can read published courses" ON public.courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- ============================================
-- RLS POLICIES — COURSE STRUCTURE (levels, modules, lessons, quizzes, questions, badges)
-- ============================================
-- Levels
CREATE POLICY "Anyone can read levels of published courses" ON public.course_levels
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND is_published = true));

CREATE POLICY "Admins can manage levels" ON public.course_levels
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Modules
CREATE POLICY "Anyone can read modules" ON public.course_modules
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.course_levels cl
    JOIN public.courses c ON c.id = cl.course_id
    WHERE cl.id = level_id AND c.is_published = true
  ));

CREATE POLICY "Admins can manage modules" ON public.course_modules
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Lessons
CREATE POLICY "Enrolled students can read lessons" ON public.course_lessons
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.course_modules cm
    JOIN public.course_levels cl ON cl.id = cm.level_id
    WHERE cm.id = module_id AND is_enrolled_in_course(auth.uid(), cl.course_id)
  ));

CREATE POLICY "Admins can manage lessons" ON public.course_lessons
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Quizzes
CREATE POLICY "Enrolled students can read quizzes" ON public.course_quizzes
  FOR SELECT TO authenticated USING (
    (course_id IS NOT NULL AND is_enrolled_in_course(auth.uid(), course_id))
    OR (module_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.course_modules cm
      JOIN public.course_levels cl ON cl.id = cm.level_id
      WHERE cm.id = module_id AND is_enrolled_in_course(auth.uid(), cl.course_id)
    ))
  );

CREATE POLICY "Admins can manage quizzes" ON public.course_quizzes
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Quiz Questions
CREATE POLICY "Enrolled students can read questions" ON public.quiz_questions
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.course_quizzes cq
    WHERE cq.id = quiz_id AND (
      (cq.course_id IS NOT NULL AND is_enrolled_in_course(auth.uid(), cq.course_id))
      OR (cq.module_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.course_modules cm
        JOIN public.course_levels cl ON cl.id = cm.level_id
        WHERE cm.id = cq.module_id AND is_enrolled_in_course(auth.uid(), cl.course_id)
      ))
    )
  ));

CREATE POLICY "Admins can manage questions" ON public.quiz_questions
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Badges
CREATE POLICY "Anyone can read badges" ON public.course_badges
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage badges" ON public.course_badges
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- ============================================
-- RLS POLICIES — STUDENT DATA
-- ============================================
-- Enrollments
CREATE POLICY "Students can read own enrollments" ON public.course_enrollments
  FOR SELECT TO authenticated USING (student_id = auth.uid());

CREATE POLICY "Students can enroll themselves" ON public.course_enrollments
  FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can manage enrollments" ON public.course_enrollments
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Lesson Progress
CREATE POLICY "Students can manage own progress" ON public.student_lesson_progress
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()));

CREATE POLICY "Admins can read all progress" ON public.student_lesson_progress
  FOR SELECT TO authenticated USING (is_course_admin(auth.uid()));

-- Quiz Attempts
CREATE POLICY "Students can manage own attempts" ON public.student_quiz_attempts
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()));

CREATE POLICY "Admins can read all attempts" ON public.student_quiz_attempts
  FOR SELECT TO authenticated USING (is_course_admin(auth.uid()));

-- Certificates
CREATE POLICY "Students can read own certificates" ON public.course_certificates
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()));

CREATE POLICY "Admins can manage certificates" ON public.course_certificates
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- Student Badges
CREATE POLICY "Students can read own badges" ON public.student_badges
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.course_enrollments ce WHERE ce.id = enrollment_id AND ce.student_id = auth.uid()));

CREATE POLICY "Admins can manage student badges" ON public.student_badges
  FOR ALL TO authenticated
  USING (is_course_admin(auth.uid()))
  WITH CHECK (is_course_admin(auth.uid()));

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
