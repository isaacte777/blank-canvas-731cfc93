-- Update assign_admin_role function to allow pastors to assign admin roles
CREATE OR REPLACE FUNCTION public.assign_admin_role(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only existing admins or pastors can assign admin roles
  IF NOT has_role(auth.uid(), 'admin') AND NOT is_pastor(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators or pastors can assign admin roles';
  END IF;
  
  -- Update the user's role to admin
  UPDATE public.user_roles 
  SET role = 'admin'
  WHERE user_id = target_user_id;
  
  RETURN true;
END;
$function$;