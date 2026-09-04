import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/hooks/use-care-data";
import { updatePatient } from "@/data/patients";
import { missingAssessment, priorityMeta, scoreTriage } from "@/lib/triage";
import type { Patient } from "@/data/types";

interface AssessmentDialogProps {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
}

/** Shared vitals / clinical-info editor. Updates the same patient record and re-runs triage. */
export function AssessmentDialog({ patient, onOpenChange }: AssessmentDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ temperature: "", heart_rate: "", spo2: "", symptoms: "" });

  useEffect(() => {
    if (patient) {
      setForm({
        temperature: patient.temperature === null ? "" : String(patient.temperature),
        heart_rate: patient.heart_rate === null ? "" : String(patient.heart_rate),
        spo2: patient.spo2 === null ? "" : String(patient.spo2),
        symptoms: patient.symptoms ?? "",
      });
    }
  }, [patient]);

  const save = useMutation({
    mutationFn: async (target: Patient) => {
      const temperature = form.temperature.trim() ? Number(form.temperature) : null;
      const heart_rate = form.heart_rate.trim() ? Number(form.heart_rate) : null;
      const spo2 = form.spo2.trim() ? Number(form.spo2) : null;
      const symptoms = form.symptoms.trim();
      const result = scoreTriage({ symptoms, temperature, heartRate: heart_rate, spo2, age: target.age });
      const priority = target.emergency_override ? target.priority : result.priority;
      await updatePatient(target.id, {
        temperature,
        heart_rate,
        spo2,
        symptoms,
        priority,
        triage_score: target.emergency_override ? target.triage_score : result.score,
        triage_factors: target.emergency_override
          ? [...target.triage_factors.filter((f) => f.kind === "override"), ...result.factors]
          : result.factors,
      });
      return { target, priority };
    },
    onSuccess: ({ target, priority }) => {
      toast.success(`${target.full_name} updated`, {
        description: `Triage re-run — ${priorityMeta[priority].label} priority`,
      });
      onOpenChange(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const missing = patient ? missingAssessment(patient) : [];

  return (
    <Dialog open={!!patient} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] [&>*]:min-w-0 overflow-y-auto overflow-x-hidden rounded-xl p-4 sm:max-w-md sm:p-6">
        <DialogHeader>
          <DialogTitle>Update assessment</DialogTitle>
          <DialogDescription>
            {patient
              ? `${patient.full_name} · ${patient.patient_code}. Saving updates the same record and re-runs triage.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {missing.length > 0 && (
          <p className="rounded-lg border border-warning/35 bg-warning-soft p-2.5 text-xs text-foreground">
            Assessment Pending — missing {missing.join(", ")}.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="assess-temperature">Temp °C</Label>
            <Input
              id="assess-temperature"
              type="number"
              step="0.1"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              placeholder="Not recorded"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assess-heart-rate">HR bpm</Label>
            <Input
              id="assess-heart-rate"
              type="number"
              value={form.heart_rate}
              onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
              placeholder="Not recorded"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="assess-spo2">SpO₂ %</Label>
            <Input
              id="assess-spo2"
              type="number"
              value={form.spo2}
              onChange={(e) => setForm({ ...form, spo2: e.target.value })}
              placeholder="Not recorded"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="assess-symptoms">Symptoms / clinical information</Label>
          <Textarea
            id="assess-symptoms"
            rows={3}
            maxLength={1000}
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            placeholder="Examination findings, reported symptoms…"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => patient && save.mutate(patient)}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save & re-run triage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
