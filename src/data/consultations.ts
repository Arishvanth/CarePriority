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
}
