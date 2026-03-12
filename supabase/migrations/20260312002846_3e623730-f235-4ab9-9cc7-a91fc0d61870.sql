
-- Crowdfunding projects table
CREATE TABLE public.crowdfunding_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titel text NOT NULL,
  beschrijving text,
  doelbedrag numeric NOT NULL DEFAULT 0,
  opgehaald_bedrag numeric NOT NULL DEFAULT 0,
  afbeelding_url text,
  actief boolean NOT NULL DEFAULT true,
  slug text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crowdfunding_projects ENABLE ROW LEVEL SECURITY;

-- Anyone can view active projects
CREATE POLICY "Anyone can view active crowdfunding projects"
ON public.crowdfunding_projects FOR SELECT TO public
USING (actief = true);

-- Admins can manage projects
CREATE POLICY "Admins can insert crowdfunding projects"
ON public.crowdfunding_projects FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update crowdfunding projects"
ON public.crowdfunding_projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete crowdfunding projects"
ON public.crowdfunding_projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can also select inactive projects
CREATE POLICY "Admins can view all crowdfunding projects"
ON public.crowdfunding_projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_crowdfunding_projects_updated_at
  BEFORE UPDATE ON public.crowdfunding_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Crowdfunding donations table
CREATE TABLE public.crowdfunding_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.crowdfunding_projects(id) ON DELETE CASCADE,
  bedrag numeric NOT NULL,
  naam text,
  email text,
  anoniem boolean NOT NULL DEFAULT false,
  mollie_payment_id text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crowdfunding_donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view paid donations (for the feed)
CREATE POLICY "Anyone can view paid crowdfunding donations"
ON public.crowdfunding_donations FOR SELECT TO public
USING (status = 'paid');

-- Admins can view all donations
CREATE POLICY "Admins can view all crowdfunding donations"
ON public.crowdfunding_donations FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for crowdfunding images
INSERT INTO storage.buckets (id, name, public) VALUES ('crowdfunding', 'crowdfunding', true)
ON CONFLICT DO NOTHING;

-- Storage policies for crowdfunding bucket
CREATE POLICY "Anyone can view crowdfunding images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'crowdfunding');

CREATE POLICY "Admins can upload crowdfunding images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'crowdfunding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete crowdfunding images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'crowdfunding' AND public.has_role(auth.uid(), 'admin'));
