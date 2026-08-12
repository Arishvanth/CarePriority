import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/care/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav({ to: "/app", replace: true });
    });
  }, [nav]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("cp_remembered_email") : null;
    if (saved) setEmail(saved);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "email" | "password";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) throw error;
      if (remember) window.localStorage.setItem("cp_remembered_email", parsed.data.email);
      else window.localStorage.removeItem("cp_remembered_email");
      toast.success("Signed in.");
      nav({ to: "/app", replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotPassword() {
    const emailOnly = signInSchema.shape.email.safeParse(email);
    if (!emailOnly.success) {
      setErrors((e) => ({ ...e, email: "Enter your email first to reset your password" }));
      return;
    }
    toast.info("Password reset is coming soon. Contact your clinic administrator.");
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure staff access
              </span>
              <h1 className="mt-5 font-display text-2xl font-semibold">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in to your CarePriority workspace.</p>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-xs">Work email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} placeholder="you@clinic.org" className="h-11 pl-9" />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="grid gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">Password</Label>
                  <button type="button" onClick={handleForgotPassword} className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" aria-invalid={!!errors.password} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }} placeholder="••••••••" className="h-11 pl-9 pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground">Remember me on this device</Label>
              </div>
              <Button type="submit" disabled={busy} className="h-11 gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Login <ArrowRight className="h-4 w-4" />
              </Button>
              <Link to="/" className="text-center text-xs text-muted-foreground hover:text-foreground">← Back to homepage</Link>
            </form>
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Demo accounts (development)</p>
              <div className="mt-2 grid gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => { setEmail(a.email); setPassword(a.password); setErrors({}); }}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-background"
                  >
                    <span className="font-medium">{a.label}</span>
                    <span className="text-muted-foreground">{a.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}