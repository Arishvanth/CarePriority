CREATE OR REPLACE FUNCTION public.block_nurse_restricted_outcomes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  IF (lower(coalesce(NEW.outcome, '')) IN ('observation', 'referred')
      OR lower(coalesce(NEW.final_outcome, '')) IN ('observation', 'referred'))
     AND public.has_role(uid, 'nurse')
     AND NOT public.has_role(uid, 'doctor')
     AND NOT public.has_role(uid, 'admin')
  THEN
    RAISE EXCEPTION 'Observation and referral outcomes can only be recorded by a doctor or administrator.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consultations_block_nurse_restricted_outcomes ON public.consultations;
CREATE TRIGGER consultations_block_nurse_restricted_outcomes
BEFORE INSERT OR UPDATE ON public.consultations
FOR EACH ROW EXECUTE FUNCTION public.block_nurse_restricted_outcomes();