
CREATE TABLE public.facility_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL DEFAULT 8,
  reservation_type TEXT NOT NULL DEFAULT 'hall',
  rooms INTEGER NOT NULL DEFAULT 1,
  guest_count INTEGER NOT NULL DEFAULT 0,
  activity_type TEXT NOT NULL DEFAULT 'overig',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facility_reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a reservation
CREATE POLICY "Anyone can submit reservation"
  ON public.facility_reservations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can view all reservations
CREATE POLICY "Admins can view all reservations"
  ON public.facility_reservations
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update reservations
CREATE POLICY "Admins can update reservations"
  ON public.facility_reservations
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete reservations
CREATE POLICY "Admins can delete reservations"
  ON public.facility_reservations
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can read approved reservations (for availability check)
CREATE POLICY "Anyone can view approved reservations"
  ON public.facility_reservations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved' OR status = 'pending');
