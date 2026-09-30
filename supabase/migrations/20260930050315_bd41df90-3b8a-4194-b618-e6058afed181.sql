-- Role helpers
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles public.app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles))
$$;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, public.app_role[]) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Patients: all staff read/insert/update, nobody deletes
DROP POLICY IF EXISTS patients_staff_all ON public.patients;
CREATE POLICY patients_staff_select ON public.patients FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY patients_staff_insert ON public.patients FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY patients_staff_update ON public.patients FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE DELETE ON public.patients FROM anon, authenticated;

-- Alerts: all staff read/insert/acknowledge, nobody deletes
DROP POLICY IF EXISTS alerts_staff_all ON public.alerts;
CREATE POLICY alerts_staff_select ON public.alerts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY alerts_staff_insert ON public.alerts FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY alerts_staff_update ON public.alerts FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
REVOKE DELETE ON public.alerts FROM anon, authenticated;

-- Consultations: clinical staff only (nurse, doctor, admin), no deletes
DROP POLICY IF EXISTS consultations_staff_all ON public.consultations;
CREATE POLICY consultations_clinical_select ON public.consultations FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['nurse','doctor','admin']::public.app_role[]));
CREATE POLICY consultations_clinical_insert ON public.consultations FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['nurse','doctor','admin']::public.app_role[]));
CREATE POLICY consultations_clinical_update ON public.consultations FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['nurse','doctor','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['nurse','doctor','admin']::public.app_role[]));
REVOKE DELETE ON public.consultations FROM anon, authenticated;

-- Referrals: doctor/admin only, no deletes
DROP POLICY IF EXISTS referrals_staff_select ON public.referrals;
DROP POLICY IF EXISTS referrals_staff_insert ON public.referrals;
DROP POLICY IF EXISTS referrals_staff_update ON public.referrals;
CREATE POLICY referrals_clinical_select ON public.referrals FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]));
CREATE POLICY referrals_clinical_insert ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]));
CREATE POLICY referrals_clinical_update ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]));
REVOKE DELETE ON public.referrals FROM anon, authenticated;

-- Observation events: doctor/admin only, append-only
DROP POLICY IF EXISTS observation_events_staff_select ON public.observation_events;
DROP POLICY IF EXISTS observation_events_staff_insert ON public.observation_events;
CREATE POLICY observation_events_clinical_select ON public.observation_events FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]));
CREATE POLICY observation_events_clinical_insert ON public.observation_events FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['doctor','admin']::public.app_role[]));
REVOKE UPDATE, DELETE ON public.observation_events FROM anon, authenticated;

-- Anonymous visitors have no business with clinical tables
REVOKE ALL ON public.patients, public.alerts, public.consultations, public.referrals, public.observation_events, public.user_roles, public.profiles FROM anon;
REVOKE DELETE ON public.profiles, public.user_roles FROM authenticated;