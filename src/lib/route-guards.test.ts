import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
const { ROUTE_ACCESS } = await import("./rbac");

const ROUTES_DIR = join(process.cwd(), "src/routes/_authenticated");
const SHELL = readFileSync(join(process.cwd(), "src/components/care/app-shell.tsx"), "utf8");

function routeFileFor(path: string) {
  return join(ROUTES_DIR, `${path.replace(/^\//, "").replace(/\//g, ".")}.tsx`);
}

function guardRoles(source: string): string[] | null {
  const m = source.match(/beforeLoad:\s*\(\)\s*=>\s*requireRole\(\[([^\]]*)\]\)/);
  return m ? [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]).sort() : null;
}

describe("route guards match the access matrix", () => {
  it("every restricted console enforces exactly its ROUTE_ACCESS roles in beforeLoad", () => {
    for (const [path, roles] of Object.entries(ROUTE_ACCESS)) {
      if (roles.length === 4) continue; // open to every staff role; session guard covers it
      const source = readFileSync(routeFileFor(path), "utf8");
      expect(guardRoles(source), path).toEqual([...roles].sort());
    }
  });

  it("every console route file under /app is listed in ROUTE_ACCESS", () => {
    const files = readdirSync(ROUTES_DIR).filter(
      (f) => /^app\.[a-z-]+\.tsx$/.test(f) && f !== "app.index.tsx",
    );
    for (const f of files) {
      const path = "/" + f.replace(/\.tsx$/, "").replace(/\./g, "/");
      expect(ROUTE_ACCESS[path], path).toBeDefined();
    }
  });

  it("every sidebar link points at a path in ROUTE_ACCESS", () => {
    const links = [...SHELL.matchAll(/\{\s*to:\s*"(\/app\/[a-z-]+)"/g)].map((m) => m[1]);
    expect(links.length).toBeGreaterThanOrEqual(10);
    for (const to of links) expect(ROUTE_ACCESS[to], to).toBeDefined();
  });

  it("the authenticated layout redirects signed-out visitors to sign-in", () => {
    const layout = readFileSync(join(ROUTES_DIR, "route.tsx"), "utf8");
    expect(layout).toMatch(/if \(error \|\| !data\.user\) throw redirect\(\{ to: "\/auth" \}\)/);
  });
});
