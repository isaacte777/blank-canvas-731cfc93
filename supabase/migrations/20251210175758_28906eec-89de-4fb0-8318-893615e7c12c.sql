-- Create a secure function to assign admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user's role to admin
  UPDATE public.user_roles 
  SET role = 'admin'
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;