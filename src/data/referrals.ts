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
 * Creates the referral for a consultation. The consultation id is unique in the
 * database, so triggering completion twice never produces a duplicate record.
 */
export async function createReferral(input: NewReferral): Promise<void> {
  const payload = { ...input, status: "referred" as const };
  const write = input.consultation_id
    ? supabase.from("referrals").upsert(payload as never, { onConflict: "consultation_id" })
    : supabase.from("referrals").insert(payload as never);

  const { data, error } = await write.select("id,status").single();
  if (error) throw error;

  const persisted = data as { id: string; status: ReferralStatus };
  if (persisted.status === "referred") return;

  const { data: corrected, error: correctionError } = await supabase
    .from("referrals")
    .update({ status: "referred" } as never)
    .eq("id", persisted.id)
    .select("status")
    .single();
  if (correctionError) throw correctionError;
  if ((corrected as { status: ReferralStatus }).status !== "referred") {
    throw new Error("Referral status could not be persisted as referred.");
  }
}

export async function updateReferralStatus(id: string, status: ReferralStatus): Promise<void> {
  const { error } = await supabase.from("referrals").update({ status } as never).eq("id", id);
  if (error) throw error;
}
