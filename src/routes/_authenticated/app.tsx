import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/care/app-shell";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "CarePriority Console" }, { name: "robots", content: "noindex" }] }),
  component: AppShell,
});