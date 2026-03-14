ALTER TABLE public.members ADD COLUMN type text NOT NULL DEFAULT 'lid';
ALTER TABLE public.members ADD COLUMN bedrag numeric NOT NULL DEFAULT 20.00;