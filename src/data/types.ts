import type { Priority, PatientStatus, TriageFactor } from "@/lib/triage";

export interface Patient {
  id: string;
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
  status: PatientStatus;
  emergency_override: boolean;
  medical_history: string[];
  room_number: string | null;
  bed_number: string | null;
  condition: string;
  observation_started_at: string | null;
  observation_doctor_id: string | null;
  registered_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  kind: string;
  severity: "critical" | "warning" | "info" | string;
  title: string;
  message: string;
  audience: string | null;
  patient_id: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export interface Consultation {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  notes: string;
  diagnosis: string;
  outcome: string;
  final_outcome: string;
  referral_note: string;
  started_at: string;
  ended_at: string | null;
}
