import { supabase } from "@/integrations/supabase/client";
import type { Alert } from "./types";

export async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as unknown as Alert[];
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
