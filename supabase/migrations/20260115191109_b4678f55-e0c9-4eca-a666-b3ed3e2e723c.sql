-- Allow owners, pastors, and admins to read all profiles
CREATE POLICY "Staff can read all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow owners and pastors to update any profile
CREATE POLICY "Owners and pastors can update profiles"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'pastor'::app_role)
);