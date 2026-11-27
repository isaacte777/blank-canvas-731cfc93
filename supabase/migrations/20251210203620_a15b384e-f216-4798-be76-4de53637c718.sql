-- Allow pastors to manage roles (similar to admins)
CREATE POLICY "Pastors can manage roles"
ON public.user_roles
FOR ALL
USING (is_pastor(auth.uid()));

-- Allow pastors to view all roles
CREATE POLICY "Pastors can view all roles"
ON public.user_roles
FOR SELECT
USING (is_pastor(auth.uid()));