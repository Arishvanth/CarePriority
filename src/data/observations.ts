import { supabase } from "@/integrations/supabase/client";

export interface ObservationEvent {
  id: string;
  patient_id: string;
  consultation_id: string | null;
  author_id: string | null;
  author_name: string;
  kind: string;
  condition: string;
  room_number: string | null;
  bed_number: string | null;
  temperature: number | null;
  heart_rate: number | null;
  spo2: number | null;
  notes: string;
  created_at: string;
}

export async function fetchObservationEvents(): Promise<ObservationEvent[]> {
  const { data, error } = await supabase
    .from("observation_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as unknown as ObservationEvent),
    temperature: row.temperature === null ? null : Number(row.temperature),
  }));
}

export type NewObservationEvent = Omit<ObservationEvent, "id" | "created_at">;

export async function addObservationEvent(input: NewObservationEvent): Promise<void> {
  const { error } = await supabase.from("observation_events").insert(input as never);
  if (error) throw error;
}
