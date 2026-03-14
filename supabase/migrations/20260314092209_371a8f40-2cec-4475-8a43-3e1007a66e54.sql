
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voornaam text NOT NULL,
  achternaam text NOT NULL,
  straat text NOT NULL,
  postcode text NOT NULL,
  plaats text NOT NULL,
  email text NOT NULL,
  telefoon text,
  mollie_customer_id text,
  mollie_subscription_id text,
  mollie_mandate_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view members" ON public.members
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
