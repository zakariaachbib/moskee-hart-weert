
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  bericht TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.feedback
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view feedback" ON public.feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feedback" ON public.feedback
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
