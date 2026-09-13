CREATE TABLE IF NOT EXISTS public.edu_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  city text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_tenants TO authenticated;
GRANT ALL ON public.edu_tenants TO service_role;
ALTER TABLE public.edu_tenants ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.edu_tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.edu_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_role text NOT NULL DEFAULT 'beheerder',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.edu_tenant_members TO authenticated;
GRANT ALL ON public.edu_tenant_members TO service_role;
ALTER TABLE public.edu_tenant_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.edu_tenant_members
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

CREATE POLICY "Tenants zichtbaar voor leden en admins" ON public.edu_tenants
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_tenant_member(auth.uid(), id));

CREATE POLICY "Admins beheren tenants" ON public.edu_tenants
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Leden zien teamleden van eigen tenant" ON public.edu_tenant_members
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins beheren teamleden" ON public.edu_tenant_members
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_edu_tenants_updated_at BEFORE UPDATE ON public.edu_tenants
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.edu_tenants (name, slug, city)
VALUES ('Nahda Weert', 'nahda-weert', 'Weert')
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.education_registrations
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.edu_tenants(id) ON DELETE SET NULL;

UPDATE public.education_registrations
SET tenant_id = (SELECT id FROM public.edu_tenants WHERE slug = 'nahda-weert')
WHERE tenant_id IS NULL;

DROP POLICY IF EXISTS "Onderwijsbeheer kan inschrijvingen lezen" ON public.education_registrations;
DROP POLICY IF EXISTS "Onderwijsbeheer kan inschrijvingen bijwerken" ON public.education_registrations;

CREATE POLICY "Tenantleden en admins lezen inschrijvingen" ON public.education_registrations
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id))
);

CREATE POLICY "Tenantleden en admins werken inschrijvingen bij" ON public.education_registrations
FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id))
);