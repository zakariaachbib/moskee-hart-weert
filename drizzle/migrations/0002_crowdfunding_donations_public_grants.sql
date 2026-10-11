-- Doneurslijst zichtbaar voor bezoekers (incl. anonieme donateurs als 'Anoniem').
-- De view draait met rechten van de eigenaar, zodat de RLS van de onderliggende
-- tabel (alleen admin) niet de openbare lijst blokkeert; alleen betaalde donaties.
DROP VIEW IF EXISTS public.crowdfunding_donations_public;
CREATE VIEW public.crowdfunding_donations_public AS
SELECT id,
    project_id,
    bedrag,
    CASE WHEN anoniem THEN NULL::text ELSE naam END AS naam,
    anoniem,
    created_at,
    status
FROM public.crowdfunding_donations
WHERE status = 'paid';

GRANT SELECT ON public.crowdfunding_donations_public TO anon;
GRANT SELECT ON public.crowdfunding_donations_public TO authenticated;
GRANT SELECT ON public.crowdfunding_donations_public TO service_role;