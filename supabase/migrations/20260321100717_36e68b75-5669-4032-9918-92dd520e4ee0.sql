CREATE TABLE public.education_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  achternaam text NOT NULL,
  voornamen text NOT NULL,
  geboortedatum date NOT NULL,
  geslacht text NOT NULL DEFAULT 'jongen',
  ouder_naam text NOT NULL,
  telefoon text NOT NULL,
  adres text NOT NULL,
  email text NOT NULL,
  toestemming_foto boolean NOT NULL DEFAULT false,
  akkoord_privacy boolean NOT NULL DEFAULT false,
  opmerkingen text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.education_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert registrations"
  ON public.education_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read registrations"
  ON public.education_registrations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));