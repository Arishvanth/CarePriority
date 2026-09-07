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
  if (input.consultation_id) {
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("consultation_id", input.consultation_id)
      .maybeSingle();
    if (existing) return;
  }
  const { error } = await supabase
    .from("referrals")
    .insert({ ...input, status: "pending" } as never);
  if (error && !error.message.includes("duplicate key")) throw error;
}

export async function updateReferralStatus(id: string, status: ReferralStatus): Promise<void> {
  const { error } = await supabase.from("referrals").update({ status } as never).eq("id", id);
  if (error) throw error;
}
