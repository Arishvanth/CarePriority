CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, job_title)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'job_title',''))
  ON CONFLICT (id) DO NOTHING;
  -- Never derive privileges from user-editable signup metadata.
  -- Every new account starts least-privileged; elevated roles are granted only by privileged operators.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'receptionist'::public.app_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $function$;