-- Add policy for pastors to view all profiles
CREATE POLICY "Pastors can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_pastor(auth.uid()));