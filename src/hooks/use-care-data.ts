import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPatients } from "@/data/patients";
import { fetchAlerts } from "@/data/alerts";
import { fetchConsultations } from "@/data/consultations";
import { fetchObservationEvents } from "@/data/observations";
import { fetchReferrals } from "@/data/referrals";

export const queryKeys = {
  patients: ["patients"] as const,
  alerts: ["alerts"] as const,
  consultations: ["consultations"] as const,
  observations: ["observation-events"] as const,
  referrals: ["referrals"] as const,
};


/** Tables watched live, each mapped to the cache entry it refreshes. */
const LIVE_TABLES = [
  ["patients", queryKeys.patients],
  ["alerts", queryKeys.alerts],
  ["consultations", queryKeys.consultations],
  ["referrals", queryKeys.referrals],
  ["observation_events", queryKeys.observations],
] as const;

/** Subscribes once to live table changes and refreshes the matching cache. */
export function useCareRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // One channel with one listener per table, torn down together on unmount,
    // so remounts never leave a second subscription behind.
    let channel = supabase.channel("care-live");
    for (const [table, queryKey] of LIVE_TABLES) {
      channel = channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        queryClient.invalidateQueries({ queryKey });
      });
    }
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function usePatients() {
  return useQuery({ queryKey: queryKeys.patients, queryFn: fetchPatients, staleTime: 10_000 });
}

export function useAlerts() {
  return useQuery({ queryKey: queryKeys.alerts, queryFn: fetchAlerts, staleTime: 10_000 });
}

export function useConsultations() {
  return useQuery({ queryKey: queryKeys.consultations, queryFn: fetchConsultations, staleTime: 30_000 });
}

export function useObservationEvents() {
  return useQuery({
    queryKey: queryKeys.observations,
    queryFn: fetchObservationEvents,
    staleTime: 10_000,
  });
}

export function useReferrals() {
  return useQuery({ queryKey: queryKeys.referrals, queryFn: fetchReferrals, staleTime: 10_000 });
}
