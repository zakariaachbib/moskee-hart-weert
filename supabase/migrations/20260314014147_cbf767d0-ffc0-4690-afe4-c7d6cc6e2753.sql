
-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  notes TEXT,
  marked_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage all attendance"
ON public.attendance FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role));

-- Education management can read all
CREATE POLICY "Education management can read attendance"
ON public.attendance FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'education_management'::edu_role));

-- Teachers can manage attendance for own classes
CREATE POLICY "Teachers can manage attendance for own classes"
ON public.attendance FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance.class_id AND classes.teacher_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM classes WHERE classes.id = attendance.class_id AND classes.teacher_id = auth.uid()));

-- Students can read own attendance
CREATE POLICY "Students can read own attendance"
ON public.attendance FOR SELECT TO authenticated
USING (student_id = auth.uid());

-- Educational documents table
CREATE TABLE public.edu_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  academic_year TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.profiles(id),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.edu_documents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage all documents"
ON public.edu_documents FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role));

-- Education management can manage documents
CREATE POLICY "Education management can manage documents"
ON public.edu_documents FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'education_management'::edu_role))
WITH CHECK (has_edu_role(auth.uid(), 'education_management'::edu_role));

-- Teachers can read documents
CREATE POLICY "Teachers can read documents"
ON public.edu_documents FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'teacher'::edu_role));

-- Students can read active documents
CREATE POLICY "Students can read active documents"
ON public.edu_documents FOR SELECT TO authenticated
USING (has_edu_role(auth.uid(), 'student'::edu_role) AND is_active = true);

-- Academic events/calendar table
CREATE TABLE public.academic_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general',
  start_date DATE NOT NULL,
  end_date DATE,
  term_id UUID REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.academic_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all events"
ON public.academic_events FOR ALL TO authenticated
USING (has_edu_role(auth.uid(), 'admin'::edu_role))
WITH CHECK (has_edu_role(auth.uid(), 'admin'::edu_role));

CREATE POLICY "Authenticated can read events"
ON public.academic_events FOR SELECT TO authenticated
USING (true);

-- Storage bucket for educational documents
INSERT INTO storage.buckets (id, name, public) VALUES ('edu-documents', 'edu-documents', false)
ON CONFLICT (id) DO NOTHING;
