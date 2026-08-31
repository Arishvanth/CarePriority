import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "doctor" | "nurse" | "receptionist";

/** Highest privilege first — a user with several roles resolves to the first match. */
const ROLE_RANK: AppRole[] = ["admin", "doctor", "nurse", "receptionist"];

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/app/admin",
  doctor: "/app/doctor",
  nurse: "/app/reception",
  receptionist: "/app/reception",
};

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
};

/** Which roles may open each console route. */
export const ROUTE_ACCESS: Record<string, AppRole[]> = {
  "/app/reception": ["receptionist", "nurse", "admin"],
  "/app/doctor": ["doctor", "nurse", "admin"],
  "/app/analytics": ["admin", "doctor"],
  "/app/admin": ["admin"],
  "/app/notifications": ["admin", "doctor", "nurse", "receptionist"],
  "/app/settings": ["admin", "doctor", "nurse", "receptionist"],
  "/app/profile": ["admin", "doctor", "nurse", "receptionist"],
};

let cache: { userId: string; role: AppRole | null } | null = null;

export function clearRoleCache() {
  cache = null;
}

/** Resolves the signed-in user's effective role from the database. Never user-selected. */
export async function fetchCurrentRole(): Promise<{ userId: string; role: AppRole | null } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    cache = null;
    return null;
  }
  const userId = data.user.id;
  if (cache && cache.userId === userId) return cache;

  const { data: rows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (rows ?? []).map((r) => r.role as AppRole);
  const role = ROLE_RANK.find((r) => roles.includes(r)) ?? null;
  cache = { userId, role };
  return cache;
}

export function homeForRole(role: AppRole | null): string {
  return role ? ROLE_HOME[role] : "/app/profile";
}

export function canAccess(role: AppRole | null, path: string): boolean {
  const allowed = ROUTE_ACCESS[path];
  if (!allowed) return true;
  return !!role && allowed.includes(role);
}

/** Route guard: use inside `beforeLoad` of a console route. */
export async function requireRole(allowed: AppRole[]) {
  const current = await fetchCurrentRole();
  if (!current) throw redirect({ to: "/auth" });
  const { role } = current;
  if (!role || !allowed.includes(role)) {
    throw redirect({ to: homeForRole(role) });
  }
  return { role };
}
