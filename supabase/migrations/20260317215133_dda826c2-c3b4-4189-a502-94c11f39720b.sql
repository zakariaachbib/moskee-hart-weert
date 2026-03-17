
CREATE TABLE public.course_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naam text NOT NULL,
  email text NOT NULL,
  telefoon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.course_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON public.course_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" ON public.course_waitlist
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete waitlist entries" ON public.course_waitlist
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
