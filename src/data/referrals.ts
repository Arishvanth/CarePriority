import { supabase } from "@/integrations/supabase/client";

export type ReferralStatus = "pending" | "referred" | "completed";

export const REFERRAL_STATUSES: ReferralStatus[] = ["pending", "referred", "completed"];

export interface Referral {
  id: string;
  patient_id: string;
  consultation_id: string | null;
  doctor_id: string | null;
  doctor_name: string;
  diagnosis: string;
  notes: string;
  reason: string;
  destination: string;
  status: ReferralStatus;
  referred_at: string;
  created_at: string;
  updated_at: string;
}

export async function fetchReferrals(): Promise<Referral[]> {
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .order("referred_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as unknown as Referral[];
}

export interface NewReferral {
  patient_id: string;
  consultation_id: string | null;
  doctor_id: string | null;
  doctor_name: string;
  diagnosis: string;
  notes: string;
  reason: string;
  destination: string;
}

/**
 * Creates the referral for a consultation, or reuses the one that already
 * exists for it. `consultation_id` is unique in the database, so a repeated
 * completion (double click, retry, reload) updates the same row instead of
 * creating a second referral. This path is only used when a consultation is
 * referred, so the row is always persisted with status "referred".
 */
export async function createReferral(input: NewReferral): Promise<string> {
  if (!input.consultation_id) {
    const { data, error } = await supabase
      .from("referrals")
      .insert({ ...input, status: "referred" } as never)
      .select("id")
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  }

  const existingId = await findReferralIdByConsultation(input.consultation_id);
  if (existingId) return updateReferralDetails(existingId, input);

  const { data, error } = await supabase
    .from("referrals")
    .insert({ ...input, status: "referred" } as never)
    .select("id")
    .single();

  if (error) {
    // Unique violation: another submission won the race — reuse that row.
    if (error.code === "23505") {
      const raced = await findReferralIdByConsultation(input.consultation_id);
      if (raced) return updateReferralDetails(raced, input);
    }
    throw error;
  }
  return (data as { id: string }).id;
}

async function findReferralIdByConsultation(consultationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("referrals")
    .select("id")
    .eq("consultation_id", consultationId)
    .maybeSingle();
  if (error) throw error;
  return data ? (data as { id: string }).id : null;
}

/**
 * Refreshes referral details on an existing row. A still-pending row is lifted
 * to "referred"; an already completed referral keeps its status.
 */
async function updateReferralDetails(id: string, input: NewReferral): Promise<string> {
  const { patient_id, doctor_id, doctor_name, diagnosis, notes, reason, destination } = input;
  const { error } = await supabase
    .from("referrals")
    .update({ patient_id, doctor_id, doctor_name, diagnosis, notes, reason, destination } as never)
    .eq("id", id);
  if (error) throw error;

  const { error: statusError } = await supabase
    .from("referrals")
    .update({ status: "referred" } as never)
    .eq("id", id)
    .eq("status", "pending");
  if (statusError) throw statusError;
  return id;
}

export async function updateReferralStatus(id: string, status: ReferralStatus): Promise<void> {
  const { error } = await supabase.from("referrals").update({ status } as never).eq("id", id);
  if (error) throw error;
}
