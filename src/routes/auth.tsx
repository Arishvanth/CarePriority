import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/care/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck, Sparkles, Stethoscope, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app/reception", replace: true });
    });
  }, [nav]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/reception`,
            data: { full_name: fullName.trim(), job_title: "Clinical staff" },
          },
        });
        if (error) throw error;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          toast.success("Account created. Check your inbox to confirm, then sign in.");
          setMode("signin");
          return;
        }
        toast.success("Welcome to CarePriority.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Signed in.");
      }
      nav({ to: "/app/reception", replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center">
        <div className="hidden lg:block">
          <Logo />
          <h2 className="mt-16 font-display text-5xl font-semibold leading-tight tracking-tight">
            The triage console<br />built for the <span className="text-primary">critical minute</span>.
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
              <div key={f.t} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
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
          <div className="mt-6 rounded-3xl border border-border bg-card p-8 shadow-lg">
            <div className="mb-6">
              <div className="inline-flex rounded-full border border-border bg-muted p-1 text-xs">
                {(["signin", "signup"] as const).map((m) => (
                  <button type="button" key={m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 transition ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold">{mode === "signin" ? "Welcome back" : "Get started"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">Access your CarePriority workspace.</p>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <div className="grid gap-1.5">
                  <Label htmlFor="name" className="text-xs">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Rhea Menon" className="h-11 pl-9" />
                  </div>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs">Work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.org" className="h-11 pl-9" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-xs">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="h-11 gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Enter console" : "Create account"} <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/" className="text-center text-xs text-muted-foreground hover:text-foreground">← Back to homepage</Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}