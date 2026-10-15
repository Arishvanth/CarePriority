-- Enforce that referrals linked to a referred consultation cannot remain pending.
-- Existing inconsistent rows are intentionally left untouched for the separately
-- scoped data-repair run.

CREATE OR REPLACE FUNCTION public.enforce_referral_status_from_consultation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  consultation_outcome text;
BEGIN
  IF NEW.consultation_id IS NULL OR NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  -- Serialize referral writes against changes to the linked consultation.
  -- This closes the race where a pending referral could be inserted while the
  -- consultation is concurrently being marked referred.
  SELECT c.final_outcome
    INTO consultation_outcome
    FROM public.consultations AS c
   WHERE c.id = NEW.consultation_id
   FOR UPDATE;

  IF consultation_outcome = 'referred' THEN
    NEW.status := 'referred';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS referrals_enforce_consultation_status ON public.referrals;
CREATE TRIGGER referrals_enforce_consultation_status
BEFORE INSERT OR UPDATE OF status, consultation_id
ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_referral_status_from_consultation();


CREATE OR REPLACE FUNCTION public.sync_pending_referrals_when_consultation_referred()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.final_outcome = 'referred'
     AND OLD.final_outcome IS DISTINCT FROM NEW.final_outcome THEN
    UPDATE public.referrals
       SET status = 'referred',
           updated_at = now()
     WHERE consultation_id = NEW.id
       AND status = 'pending';
  END IF;

  -- Completed referrals are deliberately not modified.
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS consultations_sync_referral_status ON public.consultations;
CREATE TRIGGER consultations_sync_referral_status
AFTER UPDATE OF final_outcome
ON public.consultations
FOR EACH ROW
EXECUTE FUNCTION public.sync_pending_referrals_when_consultation_referred();
