
-- Create storage bucket for sermon PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('sermons', 'sermons', true);

-- Create sermons table
CREATE TABLE public.sermons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  datum DATE NOT NULL DEFAULT CURRENT_DATE,
  omschrijving TEXT,
  bestandsnaam TEXT NOT NULL,
  bestandspad TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Anyone can view sermons
CREATE POLICY "Anyone can view sermons"
  ON public.sermons FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert sermons"
  ON public.sermons FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete sermons"
  ON public.sermons FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update sermons"
  ON public.sermons FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies: anyone can read
CREATE POLICY "Anyone can read sermon files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sermons');

-- Only admins can upload
CREATE POLICY "Admins can upload sermon files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'sermons' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete files
CREATE POLICY "Admins can delete sermon files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'sermons' AND public.has_role(auth.uid(), 'admin'));
