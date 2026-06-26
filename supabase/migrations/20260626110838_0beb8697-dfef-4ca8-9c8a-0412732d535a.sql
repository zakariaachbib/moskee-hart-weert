
-- 1) Recreate views as SECURITY INVOKER to satisfy linter
DROP VIEW IF EXISTS public.crowdfunding_donations_public;
DROP VIEW IF EXISTS public.facility_reservations_public;

CREATE VIEW public.crowdfunding_donations_public
WITH (security_invoker = true) AS
SELECT id, project_id, bedrag,
       CASE WHEN anoniem THEN NULL::text ELSE naam END AS naam,
       anoniem, created_at, status
FROM public.crowdfunding_donations
WHERE status = 'paid';

CREATE VIEW public.facility_reservations_public
WITH (security_invoker = true) AS
SELECT id, date, start_time, end_time, status, reservation_type
FROM public.facility_reservations
WHERE status = ANY (ARRAY['approved'::text, 'pending'::text]);

GRANT SELECT ON public.crowdfunding_donations_public TO anon, authenticated;
GRANT SELECT ON public.facility_reservations_public TO anon, authenticated;

-- Allow public to read only the columns the views expose, on the underlying tables.
-- Since column-level masking (anoniem -> null naam) must hold for direct table access too,
-- we add column-restricted SELECT grants AND a permissive RLS policy filtering rows.
-- For crowdfunding_donations: expose project_id, bedrag, anoniem, created_at, status, id only.
-- NOTE: 'naam' is intentionally NOT granted to anon/authenticated so direct base-table queries
-- cannot retrieve donor names; the view masks naam when anoniem=true and is the only safe path.
REVOKE SELECT ON public.crowdfunding_donations FROM anon, authenticated;
GRANT SELECT (id, project_id, bedrag, anoniem, created_at, status)
  ON public.crowdfunding_donations TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read paid donations (safe columns)" ON public.crowdfunding_donations;
CREATE POLICY "Public can read paid donations (safe columns)"
  ON public.crowdfunding_donations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'paid');

-- For facility_reservations: only expose date/time/status/type columns publicly.
REVOKE SELECT ON public.facility_reservations FROM anon, authenticated;
GRANT SELECT (id, date, start_time, end_time, status, reservation_type)
  ON public.facility_reservations TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active reservation slots (safe columns)" ON public.facility_reservations;
CREATE POLICY "Public can read active reservation slots (safe columns)"
  ON public.facility_reservations
  FOR SELECT
  TO anon, authenticated
  USING (status = ANY (ARRAY['approved'::text, 'pending'::text]));

-- 2) Tighten storage policy: teachers can only read submission files of their own students
DROP POLICY IF EXISTS "Teachers can read submission files" ON storage.objects;
CREATE POLICY "Teachers can read own students' submission files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'assignment-submissions'
    AND (
      public.has_edu_role(auth.uid(), 'education_management'::edu_role)
      OR (
        public.has_edu_role(auth.uid(), 'teacher'::edu_role)
        AND public.is_student_of_teacher(
          ((storage.foldername(name))[1])::uuid,
          auth.uid()
        )
      )
    )
  );

-- 3) Allow users to read their own role row
DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
