import { supabase } from "@/integrations/supabase/client";
import type { Patient } from "./types";
import type { Priority, TriageFactor } from "@/lib/triage";

const TABLE = "patients";

function normalise(row: Record<string, unknown>): Patient {
  return {
    ...(row as unknown as Patient),
    triage_factors: (row.triage_factors as TriageFactor[] | null) ?? [],
    medical_history: (row.medical_history as string[] | null) ?? [],
    temperature: row.temperature === null ? null : Number(row.temperature),
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("registered_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalise);
}

export interface NewPatientInput {
  patient_code: string;
  rfid_tag: string | null;
  full_name: string;
  age: number;
  gender: string;
  symptoms: string;
  temperature: number | null;
  heart_rate: number | null;
  spo2: number | null;
  priority: Priority;
  triage_score: number;
  triage_factors: TriageFactor[];
  queue_position: number;
}

/** Fields whose change can alter queue ordering. */
const QUEUE_FIELDS = ["status", "priority", "triage_score", "emergency_override", "queue_position"] as const;

/**
 * Recomputes contiguous queue positions (1..n) for every waiting patient
 * inside each priority lane, using the same ordering the queue UI shows:
 * emergency overrides first, then triage score desc, then arrival time asc.
 * Only rows whose number actually changes are written.
 */
export async function resequenceQueue(): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, priority, triage_score, emergency_override, registered_at, queue_position")
    .eq("status", "waiting");
  if (error) throw error;
  const rows = (data ?? []) as Array<{
    id: string;
    priority: Priority;
    triage_score: number;
    emergency_override: boolean;
    registered_at: string;
    queue_position: number;
  }>;
  const lanes = new Map<Priority, typeof rows>();
  for (const row of rows) {
    const lane = lanes.get(row.priority) ?? [];
    lane.push(row);
    lanes.set(row.priority, lane);
  }
  const writes: Array<PromiseLike<unknown>> = [];
  for (const lane of lanes.values()) {
    lane.sort(
      (a, b) =>
        Number(b.emergency_override) - Number(a.emergency_override) ||
        b.triage_score - a.triage_score ||
        new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime(),
    );
    lane.forEach((row, index) => {
      const position = index + 1;
      if (row.queue_position !== position) {
        writes.push(
          supabase.from(TABLE).update({ queue_position: position } as never).eq("id", row.id),
        );
      }
    });
  }
  await Promise.all(writes);
}

export async function createPatient(input: NewPatientInput): Promise<Patient> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  await resequenceQueue();
  return normalise(data as Record<string, unknown>);
}

export async function updatePatient(id: string, patch: Partial<Patient>): Promise<void> {
  const { error } = await supabase.from(TABLE).update(patch as never).eq("id", id);
  if (error) throw error;
  // Any change that can reorder or empty the queue triggers a resequence, so
  // positions stay contiguous no matter which screen made the change.
  if (QUEUE_FIELDS.some((field) => field in patch)) await resequenceQueue();
}

export interface EmergencyOverrideMeta {
  reason: string;
  actor?: string | null;
}

export async function promoteToEmergency(
  patient: Patient,
  meta?: EmergencyOverrideMeta,
): Promise<void> {
  const when = new Date().toISOString();
  const reason = meta?.reason?.trim();
  await updatePatient(patient.id, {
    priority: "HIGH",
    emergency_override: true,
    queue_position: 0,
    triage_score: 100,
    triage_factors: [
      {
        label: `Emergency override by ${meta?.actor ?? "staff"} at ${new Date(when).toLocaleString()} — was ${patient.priority}${reason ? `. Reason: ${reason}` : ""}`,
        weight: 100,
        kind: "override",
      },
      ...patient.triage_factors,
    ],
  });
}


export async function findByRfid(tag: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .ilike("rfid_tag", tag.trim())
    .maybeSingle();
  if (error) throw error;
  return data ? normalise(data as Record<string, unknown>) : null;
}
