import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchPatients } from "@/data/patients";
import { fetchAlerts } from "@/data/alerts";
import { fetchConsultations } from "@/data/consultations";
import { fetchObservationEvents } from "@/data/observations";

export const queryKeys = {
  patients: ["patients"] as const,
  alerts: ["alerts"] as const,
  consultations: ["consultations"] as const,
  observations: ["observation-events"] as const,
};

/** Subscribes once to live table changes and refreshes the matching cache. */
export function useCareRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("care-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.patients });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
      })
      .subscribe();

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
