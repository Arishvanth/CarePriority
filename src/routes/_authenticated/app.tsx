import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/care/app-shell";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Console — CarePriority" },
      { name: "description", content: "Live triage, queue and analytics console for clinical teams." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});
