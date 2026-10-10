CREATE OR REPLACE FUNCTION public.settle_crowdfunding_payment(_payment_id text, _status text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE donation public.crowdfunding_donations%ROWTYPE;
BEGIN
 SELECT * INTO donation FROM public.crowdfunding_donations WHERE mollie_payment_id = _payment_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Donation not found'; END IF;
 IF donation.status = 'paid' THEN RETURN false; END IF;
 UPDATE public.crowdfunding_donations SET status = _status WHERE id = donation.id;
 IF _status = 'paid' THEN
 UPDATE public.crowdfunding_projects SET opgehaald_bedrag = opgehaald_bedrag + donation.bedrag WHERE id = donation.project_id;
 RETURN true;
 END IF;
 RETURN false;
END; $$;
REVOKE ALL ON FUNCTION public.settle_crowdfunding_payment(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_crowdfunding_payment(text, text) TO service_role;