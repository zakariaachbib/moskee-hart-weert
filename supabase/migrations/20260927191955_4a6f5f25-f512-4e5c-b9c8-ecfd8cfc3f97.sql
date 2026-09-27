CREATE TABLE public.edu_directory_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.edu_directory_students(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.edu_tenants(id),
  lesson_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('aanwezig','te_laat','afwezig')),
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_directory_attendance TO authenticated;
GRANT ALL ON public.edu_directory_attendance TO service_role;
ALTER TABLE public.edu_directory_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage attendance" ON public.edu_directory_attendance FOR ALL TO authenticated
USING (is_course_admin(auth.uid()) OR is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (is_course_admin(auth.uid()) OR is_tenant_member(auth.uid(), tenant_id));
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.edu_directory_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();