import { supabase } from "@/integrations/supabase/client";
import { assertOutcomeAllowed } from "@/lib/rbac";
import {
  findOpenConsultationId,
  consultationBelongsToPatient,
  startConsultation,
} from "./consultations";
import { createReferral, type NewReferral } from "./referrals";
import { createAlert } from "./alerts";
import { updatePatient } from "./patients";

/**
 * Doctor "Referred" completion, written so every step is safe to repeat.
 *
 * Order matters: the consultation stays open until the referral and its alert
 * exist, and the patient leaves the queue only at the very end. If any step
 * fails, the patient is still "in consult" and a retry (same page, after a
 * refresh, or on another device) resumes the same consultation — never a new
 * one — and each step reuses what already committed.
 */

export interface ReferredCompletionInput {
  patient: { id: string; full_name: string; patient_code: string };
  doctorId: string | null;
  doctorName: string;
  preferredConsultationId: string | null;
  notes: string;
  diagnosis: string;
  reason: string;
  destination: string;
}

export interface ReferredWorkflowDeps {
  resolveConsultation(
    patientId: string,
    doctorId: string | null,
    preferredId: string | null,
  ): Promise<string>;
  recordReferredOutcome(
    consultationId: string,
    p: { notes: string; diagnosis: string; reason: string },
  ): Promise<void>;
  createReferral(input: NewReferral): Promise<string>;
  ensureReferralAlert(
    consultationId: string,
    patient: ReferredCompletionInput["patient"],
    diagnosis: string,
  ): Promise<void>;
  closeConsultation(consultationId: string): Promise<void>;
  markPatientCompleted(patientId: string): Promise<void>;
}

export function validateReferredInput(
  input: Pick<ReferredCompletionInput, "diagnosis" | "reason" | "destination">,
) {
  if (!input.diagnosis.trim()) throw new Error("Record a diagnosis before completing.");
  if (!input.reason.trim()) throw new Error("Record a reason for the referral.");
  if (!input.destination.trim()) throw new Error("Record a referral destination.");
}

export async function completeReferredConsultation(
  input: ReferredCompletionInput,
  deps: ReferredWorkflowDeps = defaultDeps,
): Promise<{ consultationId: string; referralId: string }> {
  validateReferredInput(input);
  const notes = input.notes.trim();
  const diagnosis = input.diagnosis.trim();
  const reason = input.reason.trim();
  const consultationId = await deps.resolveConsultation(
    input.patient.id,
    input.doctorId,
    input.preferredConsultationId,
  );
  await deps.recordReferredOutcome(consultationId, { notes, diagnosis, reason });
  const referralId = await deps.createReferral({
    patient_id: input.patient.id,
    consultation_id: consultationId,
    doctor_id: input.doctorId,
    doctor_name: input.doctorName,
    diagnosis,
    notes,
    reason,
    destination: input.destination.trim(),
  });
  await deps.ensureReferralAlert(consultationId, input.patient, diagnosis);
  await deps.closeConsultation(consultationId);
  await deps.markPatientCompleted(input.patient.id);
  return { consultationId, referralId };
}

/**
 * Like resolveConsultationId, but also resumes a consultation that a failed
 * earlier attempt already closed: one that ended after the patient last moved
 * to "in consult" belongs to this same visit, so we must not start another.
 */
export async function resolveDoctorConsultationId(
  patientId: string,
  doctorId: string | null,
  preferredId: string | null,
): Promise<string> {
  if (preferredId && (await consultationBelongsToPatient(preferredId, patientId)))
    return preferredId;
  const open = await findOpenConsultationId(patientId);
  if (open) return open;

  const { data: patient, error: pErr } = await supabase
    .from("patients")
    .select("status, updated_at")
    .eq("id", patientId)
    .maybeSingle();
  if (pErr) throw pErr;
  const p = patient as { status: string; updated_at: string } | null;
  if (p && p.status === "in-consult") {
    const { data, error } = await supabase
      .from("consultations")
      .select("id")
      .eq("patient_id", patientId)
      .gte("ended_at", p.updated_at)
      .order("ended_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data) return (data as { id: string }).id;
  }
  return startConsultation(patientId, doctorId);
}

async function recordReferredOutcome(
  consultationId: string,
  p: { notes: string; diagnosis: string; reason: string },
): Promise<void> {
  await assertOutcomeAllowed("referred");
  const { error } = await supabase
    .from("consultations")
    .update({
      notes: p.notes,
      diagnosis: p.diagnosis,
      outcome: "referred",
      final_outcome: "referred",
      referral_note: p.reason,
    } as never)
    .eq("id", consultationId);
  if (error) throw error;
}

/** One referral alert per consultation: a retry reuses the alert already raised. */
async function ensureReferralAlert(
  consultationId: string,
  patient: ReferredCompletionInput["patient"],
  diagnosis: string,
): Promise<void> {
  const { data: c, error: cErr } = await supabase
    .from("consultations")
    .select("started_at")
    .eq("id", consultationId)
    .single();
  if (cErr) throw cErr;
  const { data: existing, error } = await supabase
    .from("alerts")
    .select("id")
    .eq("kind", "referral")
    .eq("patient_id", patient.id)
    .gte("created_at", (c as { started_at: string }).started_at)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (existing) return;
  await createAlert({
    kind: "referral",
    severity: "warning",
    title: `Referral raised — ${patient.full_name}`,
    message: `${patient.patient_code} referred onward: ${diagnosis}.`,
    audience: "receptionist",
    patient_id: patient.id,
  });
}

async function closeConsultation(consultationId: string): Promise<void> {
  const { error } = await supabase
    .from("consultations")
    .update({ ended_at: new Date().toISOString() } as never)
    .eq("id", consultationId)
    .is("ended_at", null);
  if (error) throw error;
}

const defaultDeps: ReferredWorkflowDeps = {
  resolveConsultation: resolveDoctorConsultationId,
  recordReferredOutcome,
  createReferral,
  ensureReferralAlert,
  closeConsultation,
  markPatientCompleted: (id) => updatePatient(id, { status: "completed" }),
};
