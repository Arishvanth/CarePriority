CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid UNIQUE REFERENCES public.consultations(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES auth.users(id),
  doctor_name text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  referred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY referrals_staff_select ON public.referrals FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY referrals_staff_insert ON public.referrals FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY referrals_staff_update ON public.referrals FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX referrals_patient_idx ON public.referrals (patient_id, referred_at DESC);

CREATE TRIGGER referrals_touch BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();