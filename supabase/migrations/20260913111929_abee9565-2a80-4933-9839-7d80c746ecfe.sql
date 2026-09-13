DROP POLICY IF EXISTS "Admins kunnen inschrijvingen verwijderen" ON public.education_registrations;
CREATE POLICY "Tenantleden en admins verwijderen inschrijvingen"
ON public.education_registrations
FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR (tenant_id IS NOT NULL AND public.is_tenant_member(auth.uid(), tenant_id))
);

CREATE POLICY "Onderwijsmanagement verwijdert klasinschrijvingen"
ON public.enrollments
FOR DELETE TO authenticated
USING (public.has_edu_role(auth.uid(), 'education_management'::edu_role));