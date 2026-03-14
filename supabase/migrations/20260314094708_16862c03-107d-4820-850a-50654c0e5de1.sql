
-- Admin can update members (e.g. status changes)
CREATE POLICY "Admins can update members"
ON public.members
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can delete members
CREATE POLICY "Admins can delete members"
ON public.members
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
