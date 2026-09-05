/**
 * CarePriority triage engine.
 *
 * Deterministic, explainable scoring. Every point added to the score is
 * recorded as a factor so clinicians can see *why* a patient was prioritised.
 */

export type Priority = "HIGH" | "MODERATE" | "LOW";
export type PatientStatus = "waiting" | "in-consult" | "completed" | "observation";

export interface TriageFactor {
  label: string;
  weight: number;
  kind: "symptom" | "vital" | "demographic" | "override";
}

export interface TriageResult {
  score: number;
  priority: Priority;
  factors: TriageFactor[];
}

export interface VitalsInput {
  temperature?: number | null;
  heartRate?: number | null;
  spo2?: number | null;
  age?: number | null;
  symptoms: string;
}

/** Red-flag phrases, highest clinical weight first. */
const RED_FLAGS: Array<{ match: RegExp; label: string; weight: number }> = [
  { match: /chest pain|cardiac|heart attack/i, label: "Chest pain reported", weight: 30 },
  { match: /unconscious|unresponsive|fainted|collapse/i, label: "Loss of consciousness", weight: 32 },
  { match: /seizure|convulsion|fit\b/i, label: "Seizure activity", weight: 28 },
  { match: /stroke|slurred speech|face droop|numbness on one side/i, label: "Stroke warning signs", weight: 30 },
  { match: /bleeding|haemorrhage|hemorrhage|blood[- ]tinged|blood in/i, label: "Active or occult bleeding", weight: 26 },
  { match: /breathless|shortness of breath|difficulty breathing|cannot breathe/i, label: "Respiratory distress", weight: 24 },
  { match: /severe pain|excruciating|unbearable/i, label: "Severe pain reported", weight: 18 },
  { match: /pregnan|labour|labor pain/i, label: "Pregnancy-related presentation", weight: 16 },
  { match: /poison|overdose|snake ?bite/i, label: "Toxicological emergency", weight: 30 },
  { match: /fracture|accident|trauma|fall from/i, label: "Trauma / suspected fracture", weight: 16 },
  { match: /vomit|nausea/i, label: "Vomiting or nausea", weight: 8 },
  { match: /abdominal pain|stomach pain/i, label: "Abdominal pain", weight: 14 },
  { match: /headache|migraine/i, label: "Headache", weight: 8 },
  { match: /cough|sore throat|cold\b/i, label: "Upper respiratory symptoms", weight: 6 },
  { match: /fever|temperature/i, label: "Reported fever", weight: 8 },
];

export function scoreTriage(input: VitalsInput): TriageResult {
  const factors: TriageFactor[] = [];
  const symptoms = input.symptoms ?? "";

  for (const flag of RED_FLAGS) {
    if (flag.match.test(symptoms)) {
      factors.push({ label: flag.label, weight: flag.weight, kind: "symptom" });
    }
  }

  const temp = input.temperature ?? null;
  if (temp !== null) {
    if (temp >= 39.5) factors.push({ label: `Temperature ${temp}°C (high fever)`, weight: 24, kind: "vital" });
    else if (temp >= 38.3) factors.push({ label: `Temperature ${temp}°C (fever)`, weight: 14, kind: "vital" });
    else if (temp >= 37.5) factors.push({ label: `Temperature ${temp}°C (low-grade)`, weight: 6, kind: "vital" });
    else if (temp < 35) factors.push({ label: `Temperature ${temp}°C (hypothermia)`, weight: 26, kind: "vital" });
    else factors.push({ label: "Temperature within normal range", weight: 0, kind: "vital" });
  }

  const hr = input.heartRate ?? null;
  if (hr !== null) {
    if (hr >= 130 || hr <= 45) factors.push({ label: `Heart rate ${hr} bpm (critical)`, weight: 26, kind: "vital" });
    else if (hr >= 110) factors.push({ label: `Heart rate ${hr} bpm (tachycardic)`, weight: 16, kind: "vital" });
    else if (hr >= 100) factors.push({ label: `Heart rate ${hr} bpm (elevated)`, weight: 8, kind: "vital" });
    else factors.push({ label: "Heart rate within normal range", weight: 0, kind: "vital" });
  }

  const spo2 = input.spo2 ?? null;
  if (spo2 !== null) {
    if (spo2 < 90) factors.push({ label: `SpO₂ ${spo2}% (hypoxic)`, weight: 32, kind: "vital" });
    else if (spo2 < 94) factors.push({ label: `SpO₂ ${spo2}% (low)`, weight: 20, kind: "vital" });
    else if (spo2 < 96) factors.push({ label: `SpO₂ ${spo2}% (borderline)`, weight: 8, kind: "vital" });
    else factors.push({ label: "SpO₂ within normal range", weight: 0, kind: "vital" });
  }

  const age = input.age ?? null;
  if (age !== null) {
    if (age >= 70) factors.push({ label: `Age ${age} (high-risk group)`, weight: 12, kind: "demographic" });
    else if (age >= 60) factors.push({ label: `Age ${age} (elevated risk)`, weight: 8, kind: "demographic" });
    else if (age <= 2) factors.push({ label: `Age ${age} (infant)`, weight: 14, kind: "demographic" });
    else if (age <= 12) factors.push({ label: `Age ${age} (paediatric)`, weight: 6, kind: "demographic" });
  }

  const score = Math.min(100, factors.reduce((sum, f) => sum + f.weight, 0));
  factors.sort((a, b) => b.weight - a.weight);

  return { score, priority: priorityFromScore(score), factors };
}

export function priorityFromScore(score: number): Priority {
  if (score >= 55) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

export const PRIORITY_THRESHOLDS = { HIGH: 55, MODERATE: 25 } as const;

export const priorityMeta: Record<
  Priority,
  { label: string; chip: string; dot: string; bar: string; ring: string; description: string }
> = {
  HIGH: {
    label: "High",
    chip: "bg-danger-soft text-danger border-danger/25",
    dot: "bg-danger",
    bar: "bg-danger",
    ring: "ring-danger/25",
    description: "Needs immediate clinical attention",
  },
  MODERATE: {
    label: "Moderate",
    chip: "bg-warning-soft text-warning-foreground border-warning/35",
    dot: "bg-warning",
    bar: "bg-warning",
    ring: "ring-warning/25",
    description: "Should be seen soon",
  },
  LOW: {
    label: "Low",
    chip: "bg-success-soft text-success border-success/25",
    dot: "bg-success",
    bar: "bg-success",
    ring: "ring-success/25",
    description: "Stable, routine care",
  },
};

export const statusMeta: Record<PatientStatus, { label: string; chip: string }> = {
  waiting: { label: "Waiting", chip: "bg-muted text-muted-foreground border-border" },
  "in-consult": { label: "In consult", chip: "bg-primary-light text-primary-hover border-primary/25" },
  completed: { label: "Completed", chip: "bg-success-soft text-success border-success/25" },
  observation: { label: "Observation", chip: "bg-warning-soft text-warning border-warning/25" },
};

/** Clinical information still required before triage can be considered complete. */
export function missingAssessment(input: {
  temperature?: number | null;
  heart_rate?: number | null;
  spo2?: number | null;
  symptoms?: string | null;
}): string[] {
  const missing: string[] = [];
  if (input.temperature === null || input.temperature === undefined) missing.push("Temperature");
  if (input.heart_rate === null || input.heart_rate === undefined) missing.push("Heart rate");
  if (input.spo2 === null || input.spo2 === undefined) missing.push("SpO₂");
  if (!input.symptoms || !input.symptoms.trim()) missing.push("Symptoms");
  return missing;
}
