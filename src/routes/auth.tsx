import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/care/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Fingerprint, Mail, Lock, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CarePriority" },
      { name: "description", content: "Sign in to the CarePriority console to triage patients, run live queues, and view analytics." },
      { property: "og:title", content: "Sign in — CarePriority" },
      { property: "og:description", content: "Access the smart triage console." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-radial-red" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <Logo />
          <h2 className="mt-16 font-display text-5xl font-semibold leading-tight tracking-tight">
            The triage console<br />built for the <span className="text-gradient-red">critical minute</span>.
          </h2>
          <p className="mt-5 max-w-md text-muted-foreground">
            Voice symptoms, vitals, and RFID intake merge into a single live queue — so the sickest patient always sees the doctor first.
          </p>
          <div className="mt-10 grid gap-3">
            {[
              { icon: Stethoscope, t: "Automatic triage priority", d: "AI scores every intake in seconds." },
              { icon: ShieldCheck, t: "HIPAA-grade audit trail", d: "Every override signed and logged." },
              { icon: Sparkles, t: "Zero-training UI", d: "Designed for rural clinic staff." },
            ].map((f) => (
              <div key={f.t} className="glass flex items-start gap-3 rounded-2xl p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><f.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-medium">{f.t}</p>
                  <p className="text-xs text-muted-foreground">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden"><Logo /></div>
          <div className="glass mt-6 rounded-3xl p-8">
            <div className="mb-6">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-xs">
                {(["signin", "signup"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 transition ${mode === m ? "bg-primary text-white" : "text-muted-foreground hover:text-white"}`}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Get started"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Access your CarePriority workspace.</p>
            </div>
            <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); nav({ to: "/app/reception" }); }}>
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-xs">Full name</Label>
                  <Input id="name" placeholder="Dr. Rhea Menon" className="h-11 bg-white/5" />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs">Work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@clinic.org" className="h-11 bg-white/5 pl-9" defaultValue="rhea@clinic.org" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="h-11 bg-white/5 pl-9" defaultValue="demopass" />
                </div>
              </div>
              <Button type="submit" className="h-11 gap-2 bg-primary text-white hover:bg-primary/90">
                Enter console <ArrowRight className="h-4 w-4" />
              </Button>
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white">
                <Fingerprint className="h-4 w-4" /> Continue with staff RFID
              </button>
              <Link to="/" className="text-center text-xs text-muted-foreground hover:text-white">← Back to homepage</Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}