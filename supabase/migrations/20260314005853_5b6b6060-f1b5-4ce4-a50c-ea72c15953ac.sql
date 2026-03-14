
-- Allow admins to delete contact messages
CREATE POLICY "Admins can delete contact messages"
ON public.contact_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete membership requests
CREATE POLICY "Admins can delete membership requests"
ON public.membership_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete donations
CREATE POLICY "Admins can delete donations"
ON public.donations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete crowdfunding donations
CREATE POLICY "Admins can delete crowdfunding donations"
ON public.crowdfunding_donations
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
