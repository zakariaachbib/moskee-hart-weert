ALTER TABLE public.education_registrations
  ADD COLUMN IF NOT EXISTS schooljaar text NOT NULL DEFAULT '2026-2027',
  ADD COLUMN IF NOT EXISTS betaald boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bedrag numeric NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS betaald_op date,
  ADD COLUMN IF NOT EXISTS betaalmethode text,
  ADD COLUMN IF NOT EXISTS betaal_notitie text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nieuw',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "Admins can read registrations" ON public.education_registrations;

CREATE POLICY "Onderwijsbeheer kan inschrijvingen lezen"
ON public.education_registrations FOR SELECT TO authenticated
USING (public.is_course_admin(auth.uid()));

CREATE POLICY "Onderwijsbeheer kan inschrijvingen bijwerken"
ON public.education_registrations FOR UPDATE TO authenticated
USING (public.is_course_admin(auth.uid()))
WITH CHECK (public.is_course_admin(auth.uid()));

CREATE POLICY "Admins kunnen inschrijvingen verwijderen"
ON public.education_registrations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.education_registrations TO authenticated;
GRANT INSERT ON public.education_registrations TO anon;
GRANT ALL ON public.education_registrations TO service_role;

DROP TRIGGER IF EXISTS update_education_registrations_updated_at ON public.education_registrations;
CREATE TRIGGER update_education_registrations_updated_at
BEFORE UPDATE ON public.education_registrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();