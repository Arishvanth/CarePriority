ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS room_number text,
  ADD COLUMN IF NOT EXISTS bed_number text,
  ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS observation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS observation_doctor_id uuid;

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS final_outcome text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS referral_note text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.observation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
  author_id uuid,
  author_name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'update',
  condition text NOT NULL DEFAULT '',
  room_number text,
  bed_number text,
  temperature numeric,
  heart_rate integer,
  spo2 integer,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.observation_events TO authenticated;
GRANT ALL ON public.observation_events TO service_role;

ALTER TABLE public.observation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "observation_events_staff_select" ON public.observation_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "observation_events_staff_insert" ON public.observation_events
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS observation_events_patient_idx ON public.observation_events (patient_id, created_at DESC);