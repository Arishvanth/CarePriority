import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface StaffProfile {
  id: string;
  full_name: string;
  job_title: string;
  department: string;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id, full_name, job_title, department")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile((data as StaffProfile | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return profile;
}
