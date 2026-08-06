import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/care/logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity, ArrowRight, BarChart3, Bell, Brain, CheckCircle2, ChevronDown,
  Cpu, Fingerprint, Heart, Hospital, LayoutDashboard, MapPin, Menu, Mic, Radio,
  ShieldCheck, Sparkles, Stethoscope, Thermometer, Waves, Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarePriority — AI Smart Patient Triage & Queue Management" },
      { name: "description", content: "AI-powered triage & queue management for rural clinics. Prioritize critical patients instantly using symptoms, vitals, and RFID." },
      { property: "og:title", content: "CarePriority — Smart Patient Triage Platform" },
      { property: "og:description", content: "Reduce wait time for critical patients with AI triage, live queues, and emergency overrides." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <Problem />
        <Solution />
        <Features />
        <Workflow />
        <Tech />
        <HowItWorks />
        <Benefits />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#tech", label: "Technology" },
  { href: "#contact", label: "Contact" },
];

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden justify-center gap-7 text-sm text-muted-foreground md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-primary">{l.label}</a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline" size="sm" className="hidden rounded-full sm:inline-flex">
            <a href="#features">Learn more</a>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2 sm:px-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-aurora" aria-hidden="true" />
      <div className="absolute inset-0 bg-grid opacity-70" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1 text-xs font-medium text-primary-hover">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> AI-powered clinical triage
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            The critical patient should{" "}
            <span className="text-gradient-teal">never wait</span>.
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            CarePriority is the smart triage &amp; queue platform for rural clinics — turning voice symptoms, vitals, and RFID into an instant, ranked patient queue.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/auth">
                Sign in <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#features">
                Learn more <ChevronDown className="h-4 w-4" />
              </a>
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {["Secure by design", "HIPAA-ready", "Deploys in 1 day"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" /> {t}
              </span>
            ))}
          </div>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl">
      <div className="panel overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success/60" />
          <span className="ml-3 truncate text-xs text-muted-foreground">console.carepriority.io / reception</span>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-5">
          {[
            { label: "High priority", value: "6", color: "text-danger", bg: "bg-danger-soft" },
            { label: "In queue", value: "42", color: "text-warning", bg: "bg-warning-soft" },
            { label: "Avg wait", value: "9m", color: "text-primary", bg: "bg-primary-light" },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl border border-border p-4 ${k.bg}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={`mt-1 font-display text-3xl font-semibold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 border-t border-border p-4 sm:p-5 md:grid-cols-3">
          {[
            { p: "Aarav Sharma", sy: "Chest pain, dyspnea", pos: "#1", c: "bg-danger" },
            { p: "Priya Verma", sy: "Fever 39.6, headache", pos: "#2", c: "bg-danger" },
            { p: "Sneha Patel", sy: "Abdominal pain", pos: "#1", c: "bg-warning" },
          ].map((r) => (
            <div key={r.p} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white ${r.c}`}>{r.pos}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{r.p}</p>
                <p className="truncate text-xs text-muted-foreground">{r.sy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrustBar() {
  const items = ["Rural Health Mission", "AIIMS Alliance", "MedCore", "SwasthaNet", "PrimaryCare+", "HospitalOS"];
  return (
    <div className="border-b border-border bg-surface py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
          Trusted by clinics and networks across 12 states
        </p>
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-6">
          {items.map((i) => (
            <div key={i} className="text-center text-sm font-medium tracking-wide text-muted-foreground">{i}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ id, eyebrow, title, sub, children }: { id?: string; eyebrow: string; title: React.ReactNode; sub?: string; children?: React.ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h2>
        {sub && <p className="mt-4 text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Problem() {
  const pains = [
    { t: "First-come-first-served kills", d: "Critical patients wait behind common cold cases in overcrowded rural clinics." },
    { t: "Paper queues collapse", d: "Manual token books lose track of severity, transfers, and no-shows." },
    { t: "No visibility for doctors", d: "Physicians have no way to know who is deteriorating in the waiting hall." },
  ];
  return (
    <Section id="problem" eyebrow="The problem" title={<>Waiting rooms weren't designed <span className="text-gradient-teal">for emergencies</span>.</>} sub="Every hour, patients in rural clinics deteriorate silently in queues built for volume, not severity.">
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {pains.map((p) => (
          <div key={p.t} className="panel panel-lift rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger"><Zap className="h-5 w-5" /></div>
            <h3 className="font-display text-lg font-semibold">{p.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Solution() {
  return (
    <Section id="solution" eyebrow="The solution" title={<>One console. Every patient <span className="text-gradient-teal">ranked in seconds</span>.</>}>
      <div className="mt-12 grid gap-4 lg:grid-cols-5">
        <div className="panel rounded-3xl p-6 sm:p-8 lg:col-span-3">
          <p className="text-xs uppercase tracking-wider text-primary">Reception intake</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Voice → Vitals → RFID → Queue</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The receptionist speaks the patient's symptoms into the app. Vitals stream in from bedside sensors. An RFID wristband ties it all together. Priority is assigned instantly.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Mic, l: "Voice" },
              { icon: Heart, l: "Vitals" },
              { icon: Radio, l: "RFID" },
              { icon: Brain, l: "AI Score" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-2 p-4">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:col-span-2">
          <div className="panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-wider text-primary">Live outcome</p>
            <p className="mt-3 font-display text-4xl font-semibold text-primary">-63%</p>
            <p className="text-sm text-muted-foreground">Wait time for high-priority patients</p>
          </div>
          <div className="panel rounded-3xl p-6">
            <p className="text-xs uppercase tracking-wider text-primary">Emergency override</p>
            <p className="mt-3 text-sm text-muted-foreground">One tap moves any patient to the top of the queue with a full audit trail.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Features() {
  const feats = [
    { icon: Mic, t: "Voice symptom capture", d: "Speak, transcribe, and translate patient complaints in seconds." },
    { icon: Heart, t: "Live vitals", d: "Temperature, heart rate, and SpO₂ auto-attached to every profile." },
    { icon: Radio, t: "RFID wristbands", d: "Scan-to-retrieve at every consult room. No paper forms." },
    { icon: Brain, t: "AI triage engine", d: "Priority scored from symptoms + vitals + history." },
    { icon: LayoutDashboard, t: "Three-lane queues", d: "HIGH · MODERATE · LOW lanes with FIFO inside each." },
    { icon: Zap, t: "Emergency override", d: "Instantly promote a patient — with signed audit trail." },
    { icon: BarChart3, t: "Analytics & heatmaps", d: "Patient flow, priority mix, symptom trends." },
    { icon: MapPin, t: "Overflow re-routing", d: "Recommend nearby hospitals when capacity is exceeded." },
    { icon: ShieldCheck, t: "Role-based access", d: "Reception, doctors, and admins each get a tailored view." },
  ];
  return (
    <Section id="features" eyebrow="Features" title={<>Every capability a modern <span className="text-gradient-teal">triage room</span> needs.</>}>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {feats.map((f) => (
          <div key={f.t} className="panel panel-lift group rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Workflow() {
  const steps = [
    { icon: Mic, t: "Intake", d: "Receptionist records voice symptoms & measures vitals." },
    { icon: Brain, t: "AI Triage", d: "The engine scores severity and assigns a lane." },
    { icon: Radio, t: "RFID band", d: "A wristband is issued; patient joins the live queue." },
    { icon: Stethoscope, t: "Consult", d: "Doctor scans the band; full record loads instantly." },
    { icon: CheckCircle2, t: "Close-out", d: "Consult ends; queue re-flows in real time." },
  ];
  return (
    <Section id="workflow" eyebrow="Workflow" title={<>From walk-in to consult in <span className="text-gradient-teal">under 4 minutes</span>.</>}>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((s, i) => (
          <div key={s.t} className="panel relative rounded-2xl p-5 pt-6">
            <span className="absolute -top-3 left-5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">STEP {i + 1}</span>
            <s.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display font-semibold">{s.t}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Tech() {
  const t = [
    { icon: Brain, t: "Clinical LLM", d: "Fine-tuned symptom classifier" },
    { icon: Cpu, t: "Edge inference", d: "Runs on-prem when offline" },
    { icon: Waves, t: "Vitals stream", d: "BLE + Wi-Fi bedside sensors" },
    { icon: Radio, t: "RFID 13.56MHz", d: "Cross-vendor compatible" },
    { icon: ShieldCheck, t: "End-to-end encryption", d: "AES-256 at rest, TLS 1.3 in transit" },
    { icon: Bell, t: "Realtime sockets", d: "Sub-second queue updates" },
  ];
  return (
    <Section id="tech" eyebrow="Technology" title={<>Engineered for <span className="text-gradient-teal">low-bandwidth realities</span>.</>}>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {t.map((i) => (
          <div key={i.t} className="panel rounded-2xl p-5">
            <i.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 font-medium">{i.t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{i.d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorks() {
  return (
    <Section id="how" eyebrow="How it works" title="A live look inside the console.">
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {[
          { icon: Thermometer, t: "Reception captures", d: "Voice symptoms & vitals in under 90 seconds." },
          { icon: Fingerprint, t: "RFID assigned", d: "One tap issues a wristband tied to the record." },
          { icon: Brain, t: "AI ranks & routes", d: "The patient enters HIGH, MODERATE, or LOW lane." },
          { icon: Hospital, t: "Doctor consults", d: "Full context loads on RFID scan — no forms." },
        ].map((s, i) => (
          <div key={s.t} className="panel flex items-start gap-4 rounded-2xl p-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">0{i + 1}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 shrink-0 text-primary" />
                <h3 className="font-display text-lg font-semibold">{s.t}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Benefits() {
  const b = [
    { v: "-63%", l: "Wait time for critical patients" },
    { v: "+41%", l: "Daily patient throughput" },
    { v: "3.2×", l: "Faster doctor turnaround" },
    { v: "99.9%", l: "Uptime, even on 2G" },
  ];
  return (
    <Section eyebrow="Benefits" title={<>Measurable impact from <span className="text-gradient-teal">day one</span>.</>}>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {b.map((x) => (
          <div key={x.l} className="panel rounded-2xl p-6 text-center">
            <p className="font-display text-4xl font-semibold text-gradient-teal">{x.v}</p>
            <p className="mt-2 text-sm text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FAQ() {
  const q = [
    { q: "Does CarePriority replace our EMR?", a: "No — CarePriority sits at intake and hands off structured records to your existing EMR via HL7/FHIR." },
    { q: "What if the internet drops?", a: "The console runs on-prem edge inference. All queues remain live and sync when connectivity returns." },
    { q: "Do we need special RFID readers?", a: "Any standard 13.56MHz reader works. We include two per site in the starter kit." },
    { q: "How is patient data protected?", a: "All data is encrypted end-to-end. We are HIPAA-ready and support role-based access with signed audit trails." },
    { q: "How long does onboarding take?", a: "Most clinics are live within one day. Reception staff are productive in under an hour." },
  ];
  return (
    <Section id="faq" eyebrow="FAQ" title="Answers, in plain language.">
      <div className="panel mx-auto mt-12 max-w-3xl divide-y divide-border overflow-hidden rounded-2xl">
        {q.map((item) => (
          <details key={item.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
              <span className="font-medium">{item.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <section id="contact" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-24">
      <div className="panel relative overflow-hidden rounded-3xl p-6 sm:p-10 lg:p-14">
        <div className="absolute inset-0 bg-aurora opacity-70" aria-hidden="true" />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Talk to us</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Bring CarePriority to your clinic.</h2>
            <p className="mt-4 text-muted-foreground">
              Tell us about your clinic and our team will get back within one working day with a tailored rollout plan.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="rounded-full">
                <a href="mailto:hello@carepriority.io">hello@carepriority.io</a>
              </Button>
              <Button asChild variant="ghost" className="rounded-full">
                <a href="#features">Learn more</a>
              </Button>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Thanks — we'll be in touch within one working day.");
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="grid gap-3"
          >
            <input required placeholder="Full name" aria-label="Full name" className="h-11 rounded-xl border border-input bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
            <input required type="email" placeholder="Work email" aria-label="Work email" className="h-11 rounded-xl border border-input bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
            <input placeholder="Clinic / Hospital" aria-label="Clinic or hospital" className="h-11 rounded-xl border border-input bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
            <textarea placeholder="Tell us about your patient volume" aria-label="Message" rows={3} className="rounded-xl border border-input bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary" />
            <Button type="submit" size="lg" className="rounded-xl">
              {sent ? "Message sent" : "Contact us"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Logo />
          <span className="text-xs text-muted-foreground">© 2026 CarePriority Health, Inc.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-success" /> All systems operational
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <a href="#features" className="transition-colors hover:text-primary">Features</a>
          <a href="#contact" className="transition-colors hover:text-primary">Contact</a>
          <Link to="/auth" className="transition-colors hover:text-primary">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
