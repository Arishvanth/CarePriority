import { supabase } from "@/integrations/supabase/client";
import type { Consultation } from "./types";

export async function fetchConsultations(): Promise<Consultation[]> {
  const { data, error } = await supabase
    .from("consultations")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Consultation[];
}

export async function startConsultation(patientId: string, doctorId: string | null): Promise<string> {
  const { data, error } = await supabase
    .from("consultations")
    .insert({ patient_id: patientId, doctor_id: doctorId } as never)
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** The patient's most recent consultation that has not been closed yet, if any. */
export async function findOpenConsultationId(patientId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("consultations")
    .select("id")
    .eq("patient_id", patientId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as { id: string }).id : null;
}

/** True when the id still points at a real consultation for this patient. */
export async function consultationBelongsToPatient(
  consultationId: string,
  patientId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("consultations")
    .select("id")
    .eq("id", consultationId)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

/**
 * Resolves the consultation a clinical outcome must be written to.
 *
 * Page state is only a hint: after a refresh or on another device it is gone,
 * so we fall back to the patient's open consultation and, only when there is
 * genuinely none, start one. Never creates a second consultation while one is
 * still open.
 */
export async function resolveConsultationId(
  patientId: string,
  doctorId: string | null,
  preferredId?: string | null,
): Promise<string> {
  if (preferredId && (await consultationBelongsToPatient(preferredId, patientId))) {
    return preferredId;
  }
  const open = await findOpenConsultationId(patientId);
  if (open) return open;
  return startConsultation(patientId, doctorId);
}

export async function completeConsultation(
  id: string,
  payload: { notes: string; diagnosis: string; outcome: string },
): Promise<void> {
  const { error } = await supabase
    .from("consultations")
    .update({ ...payload, final_outcome: payload.outcome, ended_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Records the outcome a patient leaves observation with, without creating a new record. */
export async function setFinalOutcome(
  consultationId: string,
  finalOutcome: "discharged" | "referred",
  referralNote = "",
): Promise<void> {
  const { error } = await supabase
    .from("consultations")
    .update({ final_outcome: finalOutcome, referral_note: referralNote } as never)
    .eq("id", consultationId);
  if (error) throw error;

  // A consultation finalised straight from observation never went through
  // completeConsultation, so it would stay "open" and miss Patient History.
  const { error: closeError } = await supabase
    .from("consultations")
    .update({ ended_at: new Date().toISOString() } as never)
    .eq("id", consultationId)
    .is("ended_at", null);
  if (closeError) throw closeError;
}
