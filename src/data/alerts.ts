import { supabase } from "@/integrations/supabase/client";
import type { Alert } from "./types";
import { fetchAllRows } from "./fetch-all";

export async function fetchAlerts(): Promise<Alert[]> {
  const rows = await fetchAllRows(() =>
    supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
  );
  return rows as unknown as Alert[];
}

export async function createAlert(input: {
  kind: string;
  severity: string;
  title: string;
  message: string;
  audience?: string | null;
  patient_id?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("alerts").insert(input as never);
  if (error) throw error;
}

export async function acknowledgeAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from("alerts")
    .update({ acknowledged_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Outbound notification hooks. Wire an email/SMS provider here — the
 * in-app feed already works without one.
 */
export async function dispatchExternalNotification(payload: {
  channel: "email" | "sms";
  to: string;
  subject: string;
  body: string;
}): Promise<{ delivered: boolean; reason?: string }> {
  const endpoint = "/api/public/notify";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { delivered: false, reason: await res.text() };
    return { delivered: true };
  } catch (err) {
    return { delivered: false, reason: (err as Error).message };
  }
}

/**
 * Overflow alerts are idempotent for as long as the condition is active: while
 * an unacknowledged overflow alert exists, repeated detections reuse it instead
 * of stacking duplicates. Once acknowledged (condition handled), a future
 * genuine overflow raises a new alert.
 */
export async function createOverflowAlertOnce(input: {
  title: string;
  message: string;
  audience?: string | null;
}): Promise<{ created: boolean }> {
  const { data, error } = await supabase
    .from("alerts")
    .select("id")
    .eq("kind", "overflow")
    .is("acknowledged_at", null)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return { created: false };

  const { error: insertError } = await supabase.from("alerts").insert({
    kind: "overflow",
    severity: "warning",
    title: input.title,
    message: input.message,
    audience: input.audience ?? "receptionist",
  } as never);
  if (insertError) {
    // Unique partial index race: another client raised the same active alert.
    if (insertError.code === "23505") return { created: false };
    throw insertError;
  }
  return { created: true };
}
