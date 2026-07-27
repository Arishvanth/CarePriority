-- Enums
CREATE TYPE public.app_role AS ENUM ('admin','doctor','nurse','receptionist');
CREATE TYPE public.triage_priority AS ENUM ('HIGH','MODERATE','LOW');
CREATE TYPE public.patient_status AS ENUM ('waiting','in-consult','completed');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  job_title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_code text NOT NULL UNIQUE,
  rfid_tag text UNIQUE,
  full_name text NOT NULL,
  age int NOT NULL CHECK (age >= 0 AND age < 130),
  gender text NOT NULL DEFAULT 'O',
  symptoms text NOT NULL DEFAULT '',
  temperature numeric(4,1),
  heart_rate int,
  spo2 int,
  priority public.triage_priority NOT NULL DEFAULT 'LOW',
  triage_score int NOT NULL DEFAULT 0,
  triage_factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  queue_position int NOT NULL DEFAULT 0,
  status public.patient_status NOT NULL DEFAULT 'waiting',
  emergency_override boolean NOT NULL DEFAULT false,
  medical_history text[] NOT NULL DEFAULT '{}',
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_staff_all" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX patients_status_idx ON public.patients (status, priority, queue_position);

-- Consultations
CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  outcome text NOT NULL DEFAULT '',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "consultations_staff_all" ON public.consultations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Alerts
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'info',
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  audience public.app_role,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  acknowledged_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_staff_all" ON public.alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX alerts_created_idx ON public.alerts (created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER patients_touch BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- New user bootstrap
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, job_title)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'job_title',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'receptionist'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER TABLE public.patients REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.patients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Demo seed
INSERT INTO public.patients (patient_code, rfid_tag, full_name, age, gender, symptoms, temperature, heart_rate, spo2, priority, triage_score, triage_factors, queue_position, status, medical_history, registered_at) VALUES
('P-2041','RF-88A2','Aarav Sharma',62,'M','Severe chest pain radiating to left arm, shortness of breath.',37.9,122,91,'HIGH',86,'[{"label":"Chest pain reported","weight":30,"kind":"symptom"},{"label":"SpO2 91% (low)","weight":25,"kind":"vital"},{"label":"Heart rate 122 bpm (tachycardic)","weight":18,"kind":"vital"},{"label":"Age 62 (elevated risk)","weight":8,"kind":"demographic"},{"label":"Shortness of breath","weight":5,"kind":"symptom"}]'::jsonb,1,'waiting','{"Hypertension (2019)","Type 2 Diabetes"}', now() - interval '4 minutes'),
('P-2042','RF-88A3','Priya Verma',34,'F','High fever with rigors for 3 days, headache.',39.6,108,96,'HIGH',72,'[{"label":"Temperature 39.6°C (high fever)","weight":30,"kind":"vital"},{"label":"Heart rate 108 bpm","weight":12,"kind":"vital"},{"label":"Fever persisting 3 days","weight":20,"kind":"symptom"},{"label":"Headache","weight":10,"kind":"symptom"}]'::jsonb,2,'waiting','{"Dengue (2022)"}', now() - interval '9 minutes'),
('P-2043','RF-88A4','Ravi Kumar',45,'M','Persistent cough with blood-tinged sputum.',38.2,98,93,'HIGH',68,'[{"label":"Haemoptysis (blood in sputum)","weight":28,"kind":"symptom"},{"label":"SpO2 93% (borderline)","weight":18,"kind":"vital"},{"label":"Temperature 38.2°C","weight":14,"kind":"vital"},{"label":"Persistent cough","weight":8,"kind":"symptom"}]'::jsonb,3,'in-consult','{}', now() - interval '14 minutes'),
('P-2044','RF-88B1','Sneha Patel',28,'F','Abdominal pain, nausea for 6 hours.',37.4,92,98,'MODERATE',44,'[{"label":"Abdominal pain","weight":20,"kind":"symptom"},{"label":"Nausea","weight":10,"kind":"symptom"},{"label":"Mildly raised temperature","weight":8,"kind":"vital"},{"label":"Vitals otherwise stable","weight":6,"kind":"vital"}]'::jsonb,1,'waiting','{}', now() - interval '18 minutes'),
('P-2045','RF-88B2','Mohit Singh',51,'M','Lower back pain after lifting weight.',36.9,84,98,'MODERATE',38,'[{"label":"Musculoskeletal injury","weight":18,"kind":"symptom"},{"label":"Moderate pain reported","weight":12,"kind":"symptom"},{"label":"Age 51","weight":5,"kind":"demographic"},{"label":"Vitals normal","weight":3,"kind":"vital"}]'::jsonb,2,'waiting','{}', now() - interval '22 minutes'),
('P-2046','RF-88B3','Anita Rao',39,'F','Migraine with photophobia.',37.1,88,99,'MODERATE',36,'[{"label":"Severe headache","weight":18,"kind":"symptom"},{"label":"Photophobia","weight":12,"kind":"symptom"},{"label":"Vitals normal","weight":6,"kind":"vital"}]'::jsonb,3,'waiting','{}', now() - interval '27 minutes'),
('P-2047','RF-88C1','Rohan Iyer',22,'M','Sore throat, mild cough.',37.6,78,99,'LOW',18,'[{"label":"Upper respiratory symptoms","weight":10,"kind":"symptom"},{"label":"Low-grade temperature","weight":6,"kind":"vital"},{"label":"Vitals normal","weight":2,"kind":"vital"}]'::jsonb,1,'waiting','{}', now() - interval '32 minutes'),
('P-2048','RF-88C2','Meera Nair',30,'F','Routine follow-up, allergic rhinitis.',36.8,72,99,'LOW',10,'[{"label":"Routine follow-up","weight":6,"kind":"symptom"},{"label":"All vitals within normal range","weight":4,"kind":"vital"}]'::jsonb,2,'waiting','{}', now() - interval '38 minutes'),
('P-2049','RF-88C3','Kabir Shah',41,'M','Ankle sprain after fall.',36.7,80,98,'LOW',22,'[{"label":"Minor injury","weight":14,"kind":"symptom"},{"label":"Ambulatory, stable","weight":5,"kind":"symptom"},{"label":"Vitals normal","weight":3,"kind":"vital"}]'::jsonb,3,'completed','{}', now() - interval '58 minutes');

INSERT INTO public.alerts (kind, severity, title, message, audience) VALUES
('emergency','critical','Emergency override — Aarav Sharma','Suspected cardiac event promoted to the front of the queue.','doctor'),
('overflow','warning','Waiting room approaching capacity','8 patients currently waiting. Consider re-routing low-priority cases.','receptionist'),
('system','info','Triage engine updated','Scoring weights refreshed with the latest clinical protocol.', null);