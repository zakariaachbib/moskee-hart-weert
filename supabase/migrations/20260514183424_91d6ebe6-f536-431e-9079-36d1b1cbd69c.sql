CREATE TABLE public.volunteer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  leeftijd integer NOT NULL,
  email text NOT NULL,
  telefoon text,
  achtergrond text NOT NULL,
  motivatie text NOT NULL,
  beschikbare_data text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit volunteer application"
  ON public.volunteer_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view volunteer applications"
  ON public.volunteer_applications FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update volunteer applications"
  ON public.volunteer_applications FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete volunteer applications"
  ON public.volunteer_applications FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_volunteer_applications_updated_at
  BEFORE UPDATE ON public.volunteer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();