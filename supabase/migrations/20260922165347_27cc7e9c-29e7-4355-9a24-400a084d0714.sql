GRANT SELECT, INSERT, UPDATE, DELETE ON public.facility_reservations TO authenticated;
GRANT SELECT, INSERT ON public.facility_reservations TO anon;
GRANT ALL ON public.facility_reservations TO service_role;