CREATE OR REPLACE FUNCTION public.enforce_referred_consultation_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.consultation_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.consultations c
    WHERE c.id = NEW.consultation_id
      AND (lower(c.outcome) = 'referred' OR lower(c.final_outcome) = 'referred')
  ) THEN
    NEW.status := 'referred';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER referrals_enforce_referred_consultation_status
BEFORE INSERT OR UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_referred_consultation_status();