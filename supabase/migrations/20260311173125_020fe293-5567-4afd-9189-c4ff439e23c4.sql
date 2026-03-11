CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mollie_payment_id text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'open',
  naam text,
  email text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view payments" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert payments" ON public.payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update payments" ON public.payments
  FOR UPDATE TO anon, authenticated
  USING (true);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();