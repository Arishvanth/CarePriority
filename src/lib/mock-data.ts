export type Priority = "HIGH" | "MODERATE" | "LOW";

export interface Patient {
  id: string;
  rfid: string;
  name: string;
  age: number;
  gender: "M" | "F" | "O";
  symptoms: string;
  temperature: number; // C
  heartRate: number; // bpm
  spo2: number; // %
  priority: Priority;
  queuePosition: number;
  status: "waiting" | "in-consult" | "completed";
  registeredAt: string;
  history?: string[];
}

const now = Date.now();
const t = (min: number) => new Date(now - min * 60_000).toISOString();

export const mockPatients: Patient[] = [
  { id: "P-2041", rfid: "RF-88A2", name: "Aarav Sharma", age: 62, gender: "M", symptoms: "Severe chest pain radiating to left arm, shortness of breath.", temperature: 37.9, heartRate: 122, spo2: 91, priority: "HIGH", queuePosition: 1, status: "waiting", registeredAt: t(4), history: ["Hypertension (2019)", "Type 2 Diabetes"] },
  { id: "P-2042", rfid: "RF-88A3", name: "Priya Verma", age: 34, gender: "F", symptoms: "High fever with rigors for 3 days, headache.", temperature: 39.6, heartRate: 108, spo2: 96, priority: "HIGH", queuePosition: 2, status: "waiting", registeredAt: t(9), history: ["Dengue (2022)"] },
  { id: "P-2043", rfid: "RF-88A4", name: "Ravi Kumar", age: 45, gender: "M", symptoms: "Persistent cough with blood-tinged sputum.", temperature: 38.2, heartRate: 98, spo2: 93, priority: "HIGH", queuePosition: 3, status: "in-consult", registeredAt: t(14) },
  { id: "P-2044", rfid: "RF-88B1", name: "Sneha Patel", age: 28, gender: "F", symptoms: "Abdominal pain, nausea for 6 hours.", temperature: 37.4, heartRate: 92, spo2: 98, priority: "MODERATE", queuePosition: 1, status: "waiting", registeredAt: t(18) },
  { id: "P-2045", rfid: "RF-88B2", name: "Mohit Singh", age: 51, gender: "M", symptoms: "Lower back pain after lifting weight.", temperature: 36.9, heartRate: 84, spo2: 98, priority: "MODERATE", queuePosition: 2, status: "waiting", registeredAt: t(22) },
  { id: "P-2046", rfid: "RF-88B3", name: "Anita Rao", age: 39, gender: "F", symptoms: "Migraine with photophobia.", temperature: 37.1, heartRate: 88, spo2: 99, priority: "MODERATE", queuePosition: 3, status: "waiting", registeredAt: t(27) },
  { id: "P-2047", rfid: "RF-88C1", name: "Rohan Iyer", age: 22, gender: "M", symptoms: "Sore throat, mild cough.", temperature: 37.6, heartRate: 78, spo2: 99, priority: "LOW", queuePosition: 1, status: "waiting", registeredAt: t(32) },
  { id: "P-2048", rfid: "RF-88C2", name: "Meera Nair", age: 30, gender: "F", symptoms: "Routine follow-up, allergic rhinitis.", temperature: 36.8, heartRate: 72, spo2: 99, priority: "LOW", queuePosition: 2, status: "waiting", registeredAt: t(38) },
  { id: "P-2049", rfid: "RF-88C3", name: "Kabir Shah", age: 41, gender: "M", symptoms: "Ankle sprain after fall.", temperature: 36.7, heartRate: 80, spo2: 98, priority: "LOW", queuePosition: 3, status: "completed", registeredAt: t(58) },
];

export const patientFlow = [
  { hour: "07", patients: 4 }, { hour: "08", patients: 9 }, { hour: "09", patients: 18 },
  { hour: "10", patients: 24 }, { hour: "11", patients: 22 }, { hour: "12", patients: 17 },
  { hour: "13", patients: 12 }, { hour: "14", patients: 20 }, { hour: "15", patients: 26 },
  { hour: "16", patients: 21 }, { hour: "17", patients: 14 }, { hour: "18", patients: 8 },
];

export const priorityDist = [
  { name: "HIGH", value: 18, color: "#FF1A1A" },
  { name: "MODERATE", value: 34, color: "#FACC15" },
  { name: "LOW", value: 48, color: "#22C55E" },
];

export const commonSymptoms = [
  { symptom: "Fever", count: 42 },
  { symptom: "Cough", count: 31 },
  { symptom: "Chest pain", count: 18 },
  { symptom: "Headache", count: 27 },
  { symptom: "Abdominal pain", count: 22 },
  { symptom: "Injury", count: 14 },
];

export const weeklyTrend = [
  { day: "Mon", high: 12, mod: 28, low: 41 },
  { day: "Tue", high: 15, mod: 32, low: 44 },
  { day: "Wed", high: 9, mod: 26, low: 39 },
  { day: "Thu", high: 18, mod: 34, low: 48 },
  { day: "Fri", high: 21, mod: 38, low: 52 },
  { day: "Sat", high: 24, mod: 42, low: 58 },
  { day: "Sun", high: 11, mod: 22, low: 30 },
];

export const priorityStyles: Record<Priority, { badge: string; dot: string; label: string }> = {
  HIGH: { badge: "bg-primary/15 text-primary border-primary/30", dot: "bg-primary", label: "High" },
  MODERATE: { badge: "bg-warning/15 text-warning border-warning/30", dot: "bg-warning", label: "Moderate" },
  LOW: { badge: "bg-success/15 text-success border-success/30", dot: "bg-success", label: "Low" },
};