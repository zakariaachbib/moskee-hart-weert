
-- =============================================
-- MIGRATION 2: Classes, Enrollments, Materials, Assignments
-- =============================================

-- classes table
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status class_status NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- enrollments table
CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  status enrollment_status NOT NULL DEFAULT 'active',
  UNIQUE (class_id, student_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- lesson_materials table
CREATE TABLE public.lesson_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  file_url text,
  file_type text,
  external_link text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_materials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_lesson_materials_updated_at
  BEFORE UPDATE ON public.lesson_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  instructions text,
  due_date timestamptz,
  max_score numeric DEFAULT 100,
  attachment_url text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
