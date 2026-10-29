import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocked auth + role table; no real database is touched.
const state: {
  user: { id: string } | null;
  roles: string[];
  roleError: boolean;
  roleCalls: number;
} = { user: null, roles: [], roleError: false, roleCalls: 0 };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: async () =>
        state.user
          ? { data: { user: state.user }, error: null }
          : { data: { user: null }, error: new Error("no session") },
    },
    from: () => ({
      select: () => ({
        eq: async () => {
          state.roleCalls++;
          return state.roleError
            ? { data: null, error: new Error("network") }
            : { data: state.roles.map((role) => ({ role })), error: null };
        },
      }),
    }),
  },
}));

const { canAccess, fetchCurrentRole, clearRoleCache, requireRole, assertOutcomeAllowed } =
  await import("./rbac");

function signIn(id: string, roles: string[]) {
  state.user = { id };
  state.roles = roles;
}

beforeEach(() => {
  clearRoleCache();
  state.user = null;
  state.roles = [];
  state.roleError = false;
  state.roleCalls = 0;
});

describe("console access fails closed", () => {
  it("hides a console page missing from the access matrix from every role", () => {
    for (const role of ["admin", "doctor", "nurse", "receptionist"] as const) {
      expect(canAccess(role, "/app/new-unlisted-console")).toBe(false);
    }
  });

  it("does not restrict public pages outside the console", () => {
    expect(canAccess(null, "/auth")).toBe(true);
  });
});

describe("role lookup", () => {
  it("resolves the highest role when a user has several", async () => {
    signIn("u1", ["receptionist", "doctor"]);
    expect((await fetchCurrentRole())?.role).toBe("doctor");
  });

  it("returns no role on a failed lookup and does not cache the failure", async () => {
    signIn("u1", ["doctor"]);
    state.roleError = true;
    expect((await fetchCurrentRole())?.role).toBeNull();
    state.roleError = false;
    expect((await fetchCurrentRole())?.role).toBe("doctor");
  });

  it("re-reads roles when a different user signs in", async () => {
    signIn("u1", ["admin"]);
    expect((await fetchCurrentRole())?.role).toBe("admin");
    signIn("u2", ["receptionist"]);
    expect((await fetchCurrentRole())?.role).toBe("receptionist");
  });
});

describe("route guard redirects", () => {
  it("sends signed-out visitors to sign-in", async () => {
    await expect(requireRole(["admin"])).rejects.toMatchObject({
      options: { to: "/auth" },
    });
  });

  it("sends a receptionist opening Analytics back to Reception", async () => {
    signIn("u1", ["receptionist"]);
    await expect(requireRole(["admin", "doctor"])).rejects.toMatchObject({
      options: { to: "/app/reception" },
    });
  });

  it("sends a user with no role to their profile", async () => {
    signIn("u1", []);
    await expect(requireRole(["receptionist"])).rejects.toMatchObject({
      options: { to: "/app/profile" },
    });
  });

  it("lets an allowed role through", async () => {
    signIn("u1", ["doctor"]);
    await expect(requireRole(["doctor", "admin"])).resolves.toEqual({ role: "doctor" });
  });
});

describe("restricted clinical outcomes", () => {
  it("only doctors and admins may record Observation or Referred", async () => {
    for (const [role, allowed] of [
      ["doctor", true],
      ["admin", true],
      ["nurse", false],
      ["receptionist", false],
    ] as const) {
      clearRoleCache();
      signIn(`u-${role}`, [role]);
      for (const outcome of ["observation", "referred"]) {
        const check = assertOutcomeAllowed(outcome);
        if (allowed) await expect(check).resolves.toBeUndefined();
        else await expect(check).rejects.toThrow(/doctor or administrator/);
      }
    }
  });

  it("refuses restricted outcomes when the role lookup fails", async () => {
    signIn("u1", ["doctor"]);
    state.roleError = true;
    await expect(assertOutcomeAllowed("referred")).rejects.toThrow();
  });

  it("still lets a nurse record a discharge", async () => {
    signIn("u1", ["nurse"]);
    await expect(assertOutcomeAllowed("discharged")).resolves.toBeUndefined();
  });
});
