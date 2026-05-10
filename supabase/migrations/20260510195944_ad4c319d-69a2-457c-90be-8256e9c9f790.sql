-- Facility reservations: allow beheerder
CREATE POLICY "Beheerders can view all reservations"
ON public.facility_reservations FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can update reservations"
ON public.facility_reservations FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can delete reservations"
ON public.facility_reservations FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

-- Contact messages
CREATE POLICY "Beheerders can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can delete contact messages"
ON public.contact_messages FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

-- Members
CREATE POLICY "Beheerders can view members"
ON public.members FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can update members"
ON public.members FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role))
WITH CHECK (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can delete members"
ON public.members FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

-- Membership requests
CREATE POLICY "Beheerders can view membership requests"
ON public.membership_requests FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can update membership requests"
ON public.membership_requests FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));

CREATE POLICY "Beheerders can delete membership requests"
ON public.membership_requests FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'beheerder'::app_role));