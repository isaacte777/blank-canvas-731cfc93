-- Drop the existing admin profile viewing policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- The pastor policy already exists and provides the necessary access for admin management
-- Pastors can view all profiles via "Pastors can view all profiles" policy
-- Regular admins will only be able to see their own profile now