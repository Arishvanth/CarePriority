-- Run 5: enforce patient-field permissions at the database boundary.
-- Reception can manage intake/triage fields, while only clinical roles can
-- change treatment and observation state. Identity/demographic fields cannot
-- be rewritten after registration except by an administrator.

CREATE OR REPLACE FUNCTION public.guard_patient_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  actor_is_admin boolean;
  actor_is_clinical boolean;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated staff context required to update patient records'
      USING ERRCODE = '42501';
  END IF;

  actor_is_admin := public.has_role(actor_id, 'admin'::public.app_role);
  actor_is_clinical := public.has_any_role(
    actor_id,
    ARRAY['doctor'::public.app_role, 'nurse'::public.app_role, 'admin'::public.app_role]
  );

  IF NOT actor_is_admin AND (
    NEW.patient_code IS DISTINCT FROM OLD.patient_code OR
    NEW.rfid_tag IS DISTINCT FROM OLD.rfid_tag OR
    NEW.full_name IS DISTINCT FROM OLD.full_name OR
    NEW.age IS DISTINCT FROM OLD.age OR
    NEW.gender IS DISTINCT FROM OLD.gender OR
    NEW.medical_history IS DISTINCT FROM OLD.medical_history OR
    NEW.registered_at IS DISTINCT FROM OLD.registered_at
  ) THEN
    RAISE EXCEPTION 'Only an administrator may change patient identity or registration fields'
      USING ERRCODE = '42501';
  END IF;

  IF NOT actor_is_clinical AND (
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.condition IS DISTINCT FROM OLD.condition OR
    NEW.room_number IS DISTINCT FROM OLD.room_number OR
    NEW.bed_number IS DISTINCT FROM OLD.bed_number OR
    NEW.observation_started_at IS DISTINCT FROM OLD.observation_started_at OR
    NEW.observation_doctor_id IS DISTINCT FROM OLD.observation_doctor_id
  ) THEN
    RAISE EXCEPTION 'Clinical role required to change patient status or observation fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_patient_field_updates_trigger ON public.patients;
CREATE TRIGGER guard_patient_field_updates_trigger
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.guard_patient_field_updates();
