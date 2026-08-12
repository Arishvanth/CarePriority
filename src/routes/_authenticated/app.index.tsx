import { createFileRoute, redirect } from "@tanstack/react-router";
import { fetchCurrentRole, homeForRole } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/app/")({
  beforeLoad: async () => {
    const current = await fetchCurrentRole();
    if (!current) throw redirect({ to: "/auth" });
    throw redirect({ to: homeForRole(current.role) });
  },
});
