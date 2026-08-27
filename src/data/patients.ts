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

export async function createPatient(input: NewPatientInput): Promise<Patient> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw error;
  return normalise(data as Record<string, unknown>);
}

export async function updatePatient(id: string, patch: Partial<Patient>): Promise<void> {
  const { error } = await supabase.from(TABLE).update(patch as never).eq("id", id);
  if (error) throw error;
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
