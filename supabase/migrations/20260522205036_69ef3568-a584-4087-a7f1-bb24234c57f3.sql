
-- 1. Crowdfunding donations: remove public email exposure
DROP POLICY IF EXISTS "Anyone can view paid crowdfunding donations" ON public.crowdfunding_donations;

CREATE OR REPLACE VIEW public.crowdfunding_donations_public AS
SELECT id, project_id, bedrag,
  CASE WHEN anoniem THEN NULL ELSE naam END AS naam,
  anoniem, created_at, status
FROM public.crowdfunding_donations
WHERE status = 'paid';

GRANT SELECT ON public.crowdfunding_donations_public TO anon, authenticated;

-- 2. Facility reservations: remove public PII exposure
DROP POLICY IF EXISTS "Anyone can view approved reservations" ON public.facility_reservations;

CREATE OR REPLACE VIEW public.facility_reservations_public AS
SELECT id, date, start_time, end_time, status, reservation_type
FROM public.facility_reservations
WHERE status IN ('approved','pending');

GRANT SELECT ON public.facility_reservations_public TO anon, authenticated;

-- 3. Announcements: restrict student-only audience to actual students
DROP POLICY IF EXISTS "Students can read relevant announcements" ON public.announcements;
CREATE POLICY "Students can read relevant announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  has_edu_role(auth.uid(), 'student'::edu_role) AND (
    audience_role = 'student'::edu_role
    OR audience_role IS NULL
    OR (class_id IS NOT NULL AND is_enrolled_in_class(auth.uid(), class_id))
  )
);

-- 4. user_roles: explicit deny by default; only admins can write
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Storage: remove public listing on public buckets (URLs still work)
DROP POLICY IF EXISTS "Anyone can read sermon files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view crowdfunding images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
