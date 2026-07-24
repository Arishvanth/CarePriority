import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/care/logo";
import { Button } from "@/components/ui/button";
import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Brain, CheckCircle2, ChevronDown,
  Clock, Cpu, Fingerprint, Heart, Hospital, LayoutDashboard, MapPin, Mic, Radio,
  ShieldCheck, Sparkles, Stethoscope, Thermometer, Waves, Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarePriority — AI Smart Patient Triage & Queue Management" },
      { name: "description", content: "AI-powered triage & queue management for rural clinics. Prioritize critical patients instantly using symptoms, vitals, and RFID." },
      { property: "og:title", content: "CarePriority — Smart Patient Triage Platform" },
      { property: "og:description", content: "Reduce wait time for critical patients with AI triage, live queues, and emergency overrides." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustBar />
      <Problem />
      <Solution />
      <Features />
      <Workflow />
      <Tech />
      <HowItWorks />
      <Benefits />
      <Screenshots />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

function Nav() {
  const links = [
    { href: "#features", label: "Features" },
    { href: "#workflow", label: "Workflow" },
    { href: "#tech", label: "Technology" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
        <Logo />
        <nav className="ml-10 hidden gap-7 text-sm text-muted-foreground md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-white">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm text-muted-foreground transition hover:text-white sm:block">Sign in</Link>
          <Link to="/app/reception" className="group inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90">
            Open console <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-red" />
      <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 lg:pt-28">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered clinical triage
          </span>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            The critical patient<br />should <span className="text-gradient-red">never wait</span>.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            CarePriority is the smart triage & queue platform for rural clinics — turning voice symptoms, vitals, and RFID into an instant, ranked patient queue.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link to="/app/reception" className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-xl shadow-primary/40 transition hover:bg-primary/90">
              Launch demo console <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a href="#workflow" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10">
              See the workflow <ChevronDown className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> HIPAA-ready</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success" /> Deploys in 1 day</span>
          </div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-gradient-to-b from-primary/20 to-transparent blur-3xl" />
      <div className="glass overflow-hidden rounded-2xl shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs text-muted-foreground">console.carepriority.io / reception</span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          {[
            { label: "High priority", value: "6", color: "text-primary", ring: "ring-primary/30" },
            { label: "In queue", value: "42", color: "text-warning", ring: "ring-warning/30" },
            { label: "Avg wait", value: "9m", color: "text-success", ring: "ring-success/30" },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl border border-white/5 bg-white/[0.02] p-4 ring-1 ${k.ring}`}>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <p className={`mt-1 font-display text-3xl font-semibold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 border-t border-white/5 p-5 md:grid-cols-3">
          {[
            { p: "Aarav Sharma", pri: "HIGH", sy: "Chest pain, dyspnea", pos: "#1", c: "bg-primary" },
            { p: "Priya Verma", pri: "HIGH", sy: "Fever 39.6, headache", pos: "#2", c: "bg-primary" },
            { p: "Sneha Patel", pri: "MODERATE", sy: "Abdominal pain", pos: "#1", c: "bg-warning" },
          ].map((r) => (
            <div key={r.p} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-white ${r.c}`}>{r.pos}</span>
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
    <div className="border-y border-white/5 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Trusted by clinics and networks across 12 states</p>
        <div className="mt-6 grid grid-cols-2 gap-6 opacity-60 sm:grid-cols-3 md:grid-cols-6">
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
    <section id={id} className="mx-auto max-w-7xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
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
    <Section id="problem" eyebrow="The problem" title={<>Waiting rooms weren't designed <span className="text-gradient-red">for emergencies</span>.</>} sub="Every hour, patients in rural clinics deteriorate silently in queues built for volume, not severity.">
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {pains.map((p) => (
          <div key={p.t} className="glass rounded-2xl p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Zap className="h-5 w-5" /></div>
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
    <Section id="solution" eyebrow="The solution" title={<>One console. Every patient <span className="text-gradient-red">ranked in seconds</span>.</>}>
      <div className="mt-14 grid gap-4 lg:grid-cols-5">
        <div className="glass col-span-3 rounded-3xl p-8">
          <p className="text-xs uppercase tracking-wider text-primary">Reception intake</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">Voice → Vitals → RFID → Queue</h3>
          <p className="mt-2 text-sm text-muted-foreground">The receptionist speaks the patient's symptoms into the app. Vitals stream in from bedside sensors. An RFID wristband ties it all together. Priority is assigned instantly.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              { icon: Mic, l: "Voice" },
              { icon: Heart, l: "Vitals" },
              { icon: Radio, l: "RFID" },
              { icon: Brain, l: "AI Score" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <s.icon className="h-5 w-5 text-primary" />
                <span className="text-xs text-muted-foreground">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 grid gap-4">
          <div className="glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-wider text-primary">Live outcome</p>
            <p className="mt-3 font-display text-4xl font-semibold">-63%</p>
            <p className="text-sm text-muted-foreground">Wait time for high-priority patients</p>
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-xs uppercase tracking-wider text-primary">Emergency override</p>
            <p className="mt-3 text-sm">One tap moves any patient to the top of the queue with a full audit trail.</p>
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
    { icon: BarChart3, t: "Analytics & heatmaps", d: "Patient flow, priority mix, symptoms trends." },
    { icon: MapPin, t: "Overflow re-routing", d: "Recommend nearby hospitals when capacity is exceeded." },
    { icon: ShieldCheck, t: "Role-based access", d: "Reception, doctors, and admins each get a tailored view." },
  ];
  return (
    <Section id="features" eyebrow="Features" title={<>Every capability a modern <span className="text-gradient-red">triage room</span> needs.</>}>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {feats.map((f) => (
          <div key={f.t} className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5 hover:border-white/15">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary transition group-hover:bg-primary/25">
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
    <Section id="workflow" eyebrow="Workflow" title={<>From walk-in to consult in <span className="text-gradient-red">under 4 minutes</span>.</>}>
      <div className="mt-14 grid gap-4 md:grid-cols-5">
        {steps.map((s, i) => (
          <div key={s.t} className="glass relative rounded-2xl p-5">
            <span className="absolute -top-3 left-5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">STEP {i + 1}</span>
            <s.icon className="mt-2 h-5 w-5 text-primary" />
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
    { icon: ShieldCheck, t: "End-to-end encryption", d: "AES-256 at rest, TLS 1.3 transit" },
    { icon: Bell, t: "Realtime sockets", d: "Sub-second queue updates" },
  ];
  return (
    <Section id="tech" eyebrow="Technology" title={<>Engineered for <span className="text-gradient-red">low-bandwidth realities</span>.</>}>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {t.map((i) => (
          <div key={i.t} className="glass rounded-2xl p-5">
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
      <div className="mt-14 grid gap-4 lg:grid-cols-2">
        {[
          { icon: Thermometer, t: "Reception captures", d: "Voice symptoms & vitals in under 90 seconds." },
          { icon: Fingerprint, t: "RFID assigned", d: "One tap issues a wristband tied to the record." },
          { icon: Brain, t: "AI ranks & routes", d: "The patient enters HIGH, MODERATE, or LOW lane." },
          { icon: Hospital, t: "Doctor consults", d: "Full context loads on RFID scan — no forms." },
        ].map((s, i) => (
          <div key={s.t} className="glass flex items-start gap-4 rounded-2xl p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white">0{i + 1}</span>
            <div>
              <div className="flex items-center gap-2"><s.icon className="h-4 w-4 text-primary" /><h3 className="font-display text-lg font-semibold">{s.t}</h3></div>
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
    <Section eyebrow="Benefits" title={<>Measurable impact from <span className="text-gradient-red">day one</span>.</>}>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {b.map((x) => (
          <div key={x.l} className="glass rounded-2xl p-6 text-center">
            <p className="font-display text-4xl font-semibold text-gradient-red">{x.v}</p>
            <p className="mt-2 text-sm text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Screenshots() {
  const shots = [
    { t: "Reception console", d: "Voice, vitals, RFID, queue — one screen." },
    { t: "Doctor view", d: "Scan RFID and the full context is there." },
    { t: "Analytics", d: "Flow, distribution, heatmaps, KPIs." },
  ];
  return (
    <Section eyebrow="Product" title="A console designed like the tool it is.">
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {shots.map((s, i) => (
          <div key={s.t} className="glass overflow-hidden rounded-2xl">
            <div className="relative h-48 overflow-hidden border-b border-white/5 bg-gradient-to-br from-primary/10 via-background to-background">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="absolute inset-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <span className="h-2 w-2 rounded-full bg-success" />
                </div>
                <div className="mt-3 grid gap-1.5">
                  <div className="h-2 w-3/4 rounded bg-white/10" />
                  <div className="h-2 w-1/2 rounded bg-white/10" />
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    <div className="h-8 rounded bg-primary/30" />
                    <div className="h-8 rounded bg-warning/30" />
                    <div className="h-8 rounded bg-success/30" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest text-primary">0{i + 1}</p>
              <h3 className="mt-1 font-display text-lg font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
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
      <div className="mx-auto mt-14 max-w-3xl divide-y divide-white/5 rounded-2xl border border-white/5">
        {q.map((item) => (
          <details key={item.q} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between text-left">
              <span className="font-medium">{item.q}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-24">
      <div className="glass relative overflow-hidden rounded-3xl p-10 lg:p-16">
        <div className="absolute inset-0 bg-radial-red opacity-60" />
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Talk to us</p>
            <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Bring CarePriority to your clinic.</h2>
            <p className="mt-4 text-muted-foreground">Book a 20-minute walkthrough. We'll show you a live queue, an emergency override, and how the analytics roll up to your network.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/app/reception" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90">
                Try live demo <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href="mailto:hello@carepriority.io" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm text-white transition hover:bg-white/10">
                hello@carepriority.io
              </a>
            </div>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="grid gap-3">
            <input placeholder="Full name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            <input placeholder="Work email" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            <input placeholder="Clinic / Hospital" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            <textarea placeholder="Tell us about your patient volume" rows={3} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
            <Button className="h-11 bg-primary text-white hover:bg-primary/90">Request walkthrough</Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-xs text-muted-foreground">© 2026 CarePriority Health, Inc.</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-success" /> All systems operational
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Security</a>
          <a href="#" className="hover:text-white">Careers</a>
        </div>
      </div>
    </footer>
  );
}