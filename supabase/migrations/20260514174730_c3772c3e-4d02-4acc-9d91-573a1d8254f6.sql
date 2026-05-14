
CREATE TABLE public.activity_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Contactgegevens
  naam text NOT NULL,
  werkgroep text NOT NULL,
  telefoon text NOT NULL,
  email text NOT NULL,
  -- Uitgangspunt
  doel text NOT NULL,
  doelgroep text NOT NULL,
  grondslag text,
  verwacht_resultaat text,
  -- Activiteitsgegevens
  activiteit_naam text NOT NULL,
  categorie text NOT NULL,
  omschrijving text NOT NULL,
  gewenste_datum date NOT NULL,
  tijdstip text,
  aantal_personen integer NOT NULL DEFAULT 0,
  locatie text,
  -- Vrijwilligers
  vrijwilligers_aantal integer NOT NULL DEFAULT 0,
  vrijwilligers_status text NOT NULL,
  vrijwilligers_taken text,
  -- Aanvullend
  budget text,
  opmerkingen text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit activity request"
  ON public.activity_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view activity requests"
  ON public.activity_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update activity requests"
  ON public.activity_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete activity requests"
  ON public.activity_requests FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Beheerders can view activity requests"
  ON public.activity_requests FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can update activity requests"
  ON public.activity_requests FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE TRIGGER update_activity_requests_updated_at
  BEFORE UPDATE ON public.activity_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
