CREATE TABLE public.tour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  email text NOT NULL,
  telefoon text,
  datum date,
  tijd text,
  bericht text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tour_requests TO authenticated;
GRANT INSERT ON public.tour_requests TO anon;
GRANT ALL ON public.tour_requests TO service_role;

ALTER TABLE public.tour_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Iedereen kan een rondleiding aanvragen"
ON public.tour_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Beheerders bekijken rondleidingen"
ON public.tour_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'beheerder'));

CREATE POLICY "Beheerders wijzigen rondleidingen"
ON public.tour_requests FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'beheerder'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'beheerder'));

CREATE POLICY "Beheerders verwijderen rondleidingen"
ON public.tour_requests FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'beheerder'));

CREATE TRIGGER update_tour_requests_updated_at
BEFORE UPDATE ON public.tour_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();