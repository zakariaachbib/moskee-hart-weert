CREATE TABLE public.edu_directory_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.edu_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  class_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.edu_directory_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.edu_tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_name text NOT NULL,
  teacher_name text,
  birth_date date,
  parent_phones text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'actief',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_directory_teachers, public.edu_directory_students TO authenticated;
GRANT ALL ON public.edu_directory_teachers, public.edu_directory_students TO service_role;
ALTER TABLE public.edu_directory_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edu_directory_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage teachers dir" ON public.edu_directory_teachers FOR ALL TO authenticated
USING (public.is_course_admin(auth.uid()) OR public.is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (public.is_course_admin(auth.uid()) OR public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "Admins manage students dir" ON public.edu_directory_students FOR ALL TO authenticated
USING (public.is_course_admin(auth.uid()) OR public.is_tenant_member(auth.uid(), tenant_id))
WITH CHECK (public.is_course_admin(auth.uid()) OR public.is_tenant_member(auth.uid(), tenant_id));