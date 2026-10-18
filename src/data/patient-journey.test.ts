import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { scoreTriage } = await import("@/lib/triage");
const { compareQueueRows } = await import("./patients");
const { observationExitPatch } = await import("./observations");
const { completeReferredConsultation } = await import("./referral-workflow");
type Deps = import("./referral-workflow").ReferredWorkflowDeps;

/**
 * End-to-end patient journey, modelled in memory against the real workflow
 * helpers. No database is touched; the store mirrors the idempotency rules
 * the real modules enforce (one referral per consultation, one alert, etc.).
 */
function makeJourney() {
  const s = {
    patients: [] as {
      id: string;
      status: string;
      priority: string;
      triage_score: number;
      emergency_override: boolean;
      registered_at: string;
      room_number: string | null;
      bed_number: string | null;
      observation_started_at: string | null;
    }[],
    consultations: [] as { id: string; patient: string; ended: boolean; outcome: string }[],
    referrals: [] as { id: string; consultation: string; status: string }[],
    alerts: [] as { consultation: string }[],
    observationEvents: [] as { patient: string; consultation: string | null; kind: string }[],
  };

  function register(id: string, symptoms: string, vitals: { temperature?: number; heartRate?: number; spo2?: number; age?: number }) {
    const triage = scoreTriage({ symptoms, ...vitals });
    s.patients.push({
      id,
      status: "waiting",
      priority: triage.priority,
      triage_score: triage.score,
      emergency_override: false,
      registered_at: new Date(Date.now() + s.patients.length * 1000).toISOString(),
      room_number: null,
      bed_number: null,
      observation_started_at: null,
    });
    return triage;
  }

  function startConsult(patientId: string) {
    const p = s.patients.find((x) => x.id === patientId)!;
    p.status = "in-consult";
    const id = `c${s.consultations.length + 1}`;
    s.consultations.push({ id, patient: patientId, ended: false, outcome: "" });
    return id;
  }

  const deps: Deps = {
    async resolveConsultation(patientId, _d, preferred) {
      if (preferred && s.consultations.some((c) => c.id === preferred && c.patient === patientId)) return preferred;
      const open = s.consultations.find((c) => c.patient === patientId && !c.ended);
      if (open) return open.id;
      const p = s.patients.find((x) => x.id === patientId)!;
      if (p.status === "in-consult") {
        const resumed = s.consultations.find((c) => c.patient === patientId);
        if (resumed) return resumed.id;
      }
      return startConsult(patientId);
    },
    async recordReferredOutcome(id) {
      s.consultations.find((c) => c.id === id)!.outcome = "referred";
    },
    async createReferral(input) {
      const ex = s.referrals.find((r) => r.consultation === input.consultation_id);
      if (ex) {
        if (ex.status === "pending") ex.status = "referred";
        return ex.id;
      }
      const id = `r${s.referrals.length + 1}`;
      s.referrals.push({ id, consultation: input.consultation_id!, status: "referred" });
      return id;
    },
    async ensureReferralAlert(id) {
      if (!s.alerts.some((a) => a.consultation === id)) s.alerts.push({ consultation: id });
    },
    async closeConsultation(id) {
      s.consultations.find((c) => c.id === id)!.ended = true;
    },
    async markPatientCompleted(id) {
      s.patients.find((x) => x.id === id)!.status = "completed";
    },
  };

  return { s, register, startConsult, deps };
}

const referredInput = (patientId: string, preferred: string | null) => ({
  patient: { id: patientId, full_name: "Journey Patient", patient_code: "P-J1" },
  doctorId: "d1",
  doctorName: "Dr Journey",
  preferredConsultationId: preferred,
  notes: "notes",
  diagnosis: "dx",
  reason: "needs specialist",
  destination: "District Hospital",
});

describe("patient journey", () => {
  it("1. registration establishes triage and queue state", () => {
    const { s, register } = makeJourney();
    const triage = register("p1", "severe chest pain", { temperature: 38.5, heartRate: 120, spo2: 95, age: 65 });
    expect(triage.priority).toBe("HIGH");
    expect(triage.score).toBeGreaterThanOrEqual(55);
    expect(triage.factors.length).toBeGreaterThan(0);
    expect(s.patients[0]).toMatchObject({ status: "waiting", priority: "HIGH" });
  });

  it("2. doctor opens and resolves the patient's consultation", async () => {
    const { s, register, startConsult, deps } = makeJourney();
    register("p1", "headache", { age: 40 });
    const cid = startConsult("p1");
    const { consultationId, referralId } = await completeReferredConsultation(referredInput("p1", cid), deps);
    expect(consultationId).toBe(cid);
    expect(referralId).toBe("r1");
    expect(s.consultations[0]).toMatchObject({ ended: true, outcome: "referred" });
    expect(s.patients[0].status).toBe("completed");
  });

  it("3a. referral outcome links exactly one referral and one alert", async () => {
    const { s, register, startConsult, deps } = makeJourney();
    register("p1", "abdominal pain", { age: 30 });
    const cid = startConsult("p1");
    await completeReferredConsultation(referredInput("p1", cid), deps);
    expect(s.referrals).toHaveLength(1);
    expect(s.referrals[0]).toMatchObject({ consultation: cid, status: "referred" });
    expect(s.alerts).toHaveLength(1);
  });

  it("3b. observation exit clears room/bed and keeps the timeline event", () => {
    const { s, register } = makeJourney();
    register("p1", "fever", { temperature: 39 });
    const p = s.patients[0];
    p.status = "observation";
    p.room_number = "R1";
    p.bed_number = "B2";
    p.observation_started_at = new Date().toISOString();
    s.observationEvents.push({ patient: "p1", consultation: "c1", kind: "admitted" });
    Object.assign(p, observationExitPatch());
    s.observationEvents.push({ patient: "p1", consultation: "c1", kind: "discharged" });
    expect(p).toMatchObject({ status: "completed", room_number: null, bed_number: null, observation_started_at: null });
    expect(s.observationEvents.map((e) => e.kind)).toEqual(["admitted", "discharged"]);
  });

  it("4. refresh mid-completion resumes the same consultation, no duplicates", async () => {
    const { s, register, startConsult, deps } = makeJourney();
    register("p1", "chest pain", { spo2: 92 });
    const cid = startConsult("p1");
    // First attempt dies after the referral committed but before the consult
    // closed — the patient is still "in consult", so a refresh can retry.
    let failClose = true;
    const flaky: Deps = {
      ...deps,
      async closeConsultation(id) {
        if (failClose) {
          failClose = false;
          throw new Error("network failure in closeConsultation");
        }
        return deps.closeConsultation(id);
      },
    };
    await expect(completeReferredConsultation(referredInput("p1", cid), flaky)).rejects.toThrow("closeConsultation");
    // Refresh: page state (preferred id) is gone; the retry must resume the
    // same consultation, not start a second one or duplicate the referral.
    await completeReferredConsultation(referredInput("p1", null), deps);
    expect(s.consultations).toHaveLength(1);
    expect(s.referrals).toHaveLength(1);
    expect(s.alerts).toHaveLength(1);
    expect(s.patients[0].status).toBe("completed");
  });

  it("5. observation exit patch never leaks episode fields into history", () => {
    const patch = observationExitPatch();
    expect(patch).toEqual({ status: "completed", room_number: null, bed_number: null, observation_started_at: null });
  });

  it("6. emergency override orders first without displacing the wrong patient", () => {
    const rows = [
      { id: "a", triage_score: 80, emergency_override: false, registered_at: "2026-01-01T08:00:00Z" },
      { id: "b", triage_score: 40, emergency_override: true, registered_at: "2026-01-01T09:00:00Z" },
      { id: "c", triage_score: 90, emergency_override: false, registered_at: "2026-01-01T07:00:00Z" },
    ];
    const ordered = [...rows].sort(compareQueueRows).map((r) => r.id);
    expect(ordered).toEqual(["b", "c", "a"]); // override first, then score desc
    // ties on score fall back to earliest arrival
    const tied = [
      { id: "x", triage_score: 50, emergency_override: false, registered_at: "2026-01-01T10:00:00Z" },
      { id: "y", triage_score: 50, emergency_override: false, registered_at: "2026-01-01T09:00:00Z" },
    ];
    expect([...tied].sort(compareQueueRows).map((r) => r.id)).toEqual(["y", "x"]);
  });
});
