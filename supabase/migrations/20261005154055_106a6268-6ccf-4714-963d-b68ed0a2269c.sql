CREATE TABLE public.convert_committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.edu_tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convert_committee_members TO authenticated;
GRANT ALL ON public.convert_committee_members TO service_role;
ALTER TABLE public.convert_committee_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_convert_committee(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) OR EXISTS (
    SELECT 1 FROM public.convert_committee_members WHERE user_id = _user_id AND tenant_id = _tenant_id)
$$;

CREATE POLICY "Own membership or admin" ON public.convert_committee_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage members" ON public.convert_committee_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.convert_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.edu_tenants(id) ON DELETE CASCADE,
  voornaam text NOT NULL DEFAULT '',
  achternaam text NOT NULL DEFAULT '',
  volledige_naam text NOT NULL,
  geboortedatum text,
  geboorteplaats text,
  geboorteplaats_ar text,
  nationaliteit text,
  nationaliteit_ar text,
  adres text,
  adres_ar text,
  email text,
  telefoon text,
  form_path text,
  certificate_path text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.convert_certificates TO authenticated;
GRANT ALL ON public.convert_certificates TO service_role;
ALTER TABLE public.convert_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Committee reads" ON public.convert_certificates FOR SELECT TO authenticated USING (public.is_convert_committee(auth.uid(), tenant_id));
CREATE POLICY "Committee inserts" ON public.convert_certificates FOR INSERT TO authenticated WITH CHECK (public.is_convert_committee(auth.uid(), tenant_id));
CREATE POLICY "Committee updates" ON public.convert_certificates FOR UPDATE TO authenticated USING (public.is_convert_committee(auth.uid(), tenant_id)) WITH CHECK (public.is_convert_committee(auth.uid(), tenant_id));
CREATE POLICY "Committee deletes" ON public.convert_certificates FOR DELETE TO authenticated USING (public.is_convert_committee(auth.uid(), tenant_id));
CREATE TRIGGER update_convert_certificates_updated_at BEFORE UPDATE ON public.convert_certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Committee reads convert files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'convert-certificates' AND public.is_convert_committee(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "Committee uploads convert files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'convert-certificates' AND public.is_convert_committee(auth.uid(), ((storage.foldername(name))[1])::uuid));
CREATE POLICY "Committee deletes convert files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'convert-certificates' AND public.is_convert_committee(auth.uid(), ((storage.foldername(name))[1])::uuid));