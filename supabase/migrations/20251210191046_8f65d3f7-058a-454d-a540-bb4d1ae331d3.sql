-- Secure the assign_admin_role function by requiring the caller to be an existing admin
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only existing admins can assign admin roles
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can assign admin roles';
  END IF;
  
  -- Update the user's role to admin
  UPDATE public.user_roles 
  SET role = 'admin'
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$$;