import { useEffect, useState } from "react";
import { fetchCurrentRole, type AppRole } from "@/lib/rbac";

export function useRole() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCurrentRole().then((res) => {
      if (!active) return;
      setRole(res?.role ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { role, loading };
}
