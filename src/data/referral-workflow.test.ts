import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
const { completeReferredConsultation } = await import("./referral-workflow");
type Deps = import("./referral-workflow").ReferredWorkflowDeps;

/** In-memory model of the records, mirroring the real idempotency rules. */
function makeStore() {
  const s = {
    consultations: [{ id: "c1", patient: "p1", ended: false, outcome: "" }],
    referrals: [] as { id: string; consultation: string; status: string; destination: string }[],
    alerts: [] as { consultation: string }[],
    patientStatus: "in-consult",
    failOnce: new Set<keyof Deps>(),
  };
  const maybeFail = (k: keyof Deps) => {
    if (s.failOnce.delete(k)) throw new Error(`network failure in ${k}`);
  };
  const deps: Deps = {
    async resolveConsultation(patientId, _d, preferred) {
      maybeFail("resolveConsultation");
      if (preferred) return preferred;
      const open = s.consultations.find((c) => c.patient === patientId && !c.ended);
      if (open) return open.id;
      // resumable: closed this visit while patient still in consult
      const resumed = s.patientStatus === "in-consult" && s.consultations.find((c) => c.patient === patientId);
      if (resumed) return resumed.id;
      const id = `c${s.consultations.length + 1}`;
      s.consultations.push({ id, patient: patientId, ended: false, outcome: "" });
      return id;
    },
    async recordReferredOutcome(id) {
      maybeFail("recordReferredOutcome");
      s.consultations.find((c) => c.id === id)!.outcome = "referred";
    },
    async createReferral(input) {
      maybeFail("createReferral");
      const ex = s.referrals.find((r) => r.consultation === input.consultation_id);
      if (ex) {
        ex.destination = input.destination;
        if (ex.status === "pending") ex.status = "referred";
        return ex.id;
      }
      const id = `r${s.referrals.length + 1}`;
      s.referrals.push({ id, consultation: input.consultation_id!, status: "referred", destination: input.destination });
      return id;
    },
    async ensureReferralAlert(id) {
      maybeFail("ensureReferralAlert");
      if (!s.alerts.some((a) => a.consultation === id)) s.alerts.push({ consultation: id });
    },
    async closeConsultation(id) {
      maybeFail("closeConsultation");
      s.consultations.find((c) => c.id === id)!.ended = true;
    },
    async markPatientCompleted() {
      maybeFail("markPatientCompleted");
      s.patientStatus = "completed";
    },
  };
  return { s, deps };
}

const input = (preferred: string | null = "c1") => ({
  patient: { id: "p1", full_name: "Test", patient_code: "P-1" },
  doctorId: "d1",
  doctorName: "Dr",
  preferredConsultationId: preferred,
  notes: "n",
  diagnosis: "dx",
  reason: "needs CT",
  destination: "District Hospital",
});

function expectSingleCompletedVisit(s: ReturnType<typeof makeStore>["s"]) {
  expect(s.consultations).toHaveLength(1);
  expect(s.consultations[0]).toMatchObject({ ended: true, outcome: "referred" });
  expect(s.referrals).toHaveLength(1);
  expect(s.referrals[0].consultation).toBe("c1");
  expect(s.alerts).toHaveLength(1);
  expect(s.patientStatus).toBe("completed");
}

describe("doctor referred completion", () => {
  it("is idempotent when submitted twice", async () => {
    const { s, deps } = makeStore();
    await completeReferredConsultation(input(), deps);
    await completeReferredConsultation(input(), deps);
    expectSingleCompletedVisit(s);
  });

  it("survives concurrent double-submit without duplicates", async () => {
    const { s, deps } = makeStore();
    await Promise.all([completeReferredConsultation(input(), deps), completeReferredConsultation(input(), deps)]);
    expectSingleCompletedVisit(s);
  });

  const steps: (keyof Deps)[] = [
    "recordReferredOutcome", "createReferral", "ensureReferralAlert", "closeConsultation", "markPatientCompleted",
  ];
  for (const step of steps) {
    it(`resumes the same visit after a refresh when ${step} fails`, async () => {
      const { s, deps } = makeStore();
      s.failOnce.add(step);
      await expect(completeReferredConsultation(input(), deps)).rejects.toThrow(step);
      expect(s.patientStatus).toBe("in-consult"); // still retryable from the queue
      await completeReferredConsultation(input(null), deps); // page state lost
      expectSingleCompletedVisit(s);
    });
  }

  it("keeps a completed referral completed on retry", async () => {
    const { s, deps } = makeStore();
    await completeReferredConsultation(input(), deps);
    s.referrals[0].status = "completed";
    await completeReferredConsultation(input(), deps);
    expect(s.referrals[0].status).toBe("completed");
  });

  it("rejects missing reason or destination before writing", async () => {
    const { s, deps } = makeStore();
    await expect(completeReferredConsultation({ ...input(), reason: " " }, deps)).rejects.toThrow("reason");
    await expect(completeReferredConsultation({ ...input(), destination: "" }, deps)).rejects.toThrow("destination");
    expect(s.referrals).toHaveLength(0);
    expect(s.consultations[0].outcome).toBe("");
  });
});
