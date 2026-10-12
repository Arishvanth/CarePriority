import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
const { canAccess, homeForRole } = await import("./rbac");

describe("route access matrix", () => {
  it("keeps receptionists out of clinical and admin consoles", () => {
    for (const p of ["/app/doctor", "/app/observation", "/app/referrals", "/app/history", "/app/analytics", "/app/admin"]) {
      expect(canAccess("receptionist", p)).toBe(false);
    }
    expect(canAccess("receptionist", "/app/reception")).toBe(true);
  });
  it("limits nurses to reception and doctor queue", () => {
    expect(canAccess("nurse", "/app/doctor")).toBe(true);
    for (const p of ["/app/observation", "/app/referrals", "/app/history", "/app/analytics", "/app/admin"]) {
      expect(canAccess("nurse", p)).toBe(false);
    }
  });
  it("gives admin every console and doctor no admin", () => {
    expect(canAccess("admin", "/app/admin")).toBe(true);
    expect(canAccess("doctor", "/app/admin")).toBe(false);
    expect(canAccess("doctor", "/app/analytics")).toBe(true);
  });
  it("denies users without a role", () => {
    expect(canAccess(null, "/app/reception")).toBe(false);
    expect(homeForRole(null)).toBe("/app/profile");
  });
});
