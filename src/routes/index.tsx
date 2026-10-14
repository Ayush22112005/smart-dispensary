import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME, CAMPUS_NAME, AMBULANCE_NUMBER, HEALTH_CENTRE_EMAIL } from "@/lib/campus";
import { useEmergencyNumbers } from "@/hooks/use-emergency-numbers";
import appLogo from "@/assets/thapar-logo.jpg";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Smart Dispensary — Campus Healthcare for Thapar Students" },
      {
        name: "description",
        content:
          "One app for Thapar students: online doctor consults, dispensary appointments with live queue tokens, ambulance SOS, and medicine delivery.",
      },
      { property: "og:title", content: "Smart Dispensary — Campus Healthcare for Thapar Students" },
      {
        property: "og:description",
        content:
          "Consult doctors, book dispensary slots, request an ambulance and order medicines — all from one campus health platform.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    title: "Talk to a doctor",
    body: "Describe your symptoms, chat with a campus doctor and move to a video call when needed.",
  },
  {
    title: "Dispensary appointments",
    body: "Pick a doctor and a slot, get a token number and watch the queue move in real time.",
  },
  {
    title: "Emergency ambulance",
    body: "One tap shares your live location with the dispensary and tracks the ambulance status.",
  },
  {
    title: "Medicine delivery",
    body: "Search the dispensary catalogue, upload a prescription and get it delivered to your hostel.",
  },
  {
    title: "AI health assistant",
    body: "First-level triage that tells you what to take and when to see a doctor — never a diagnosis.",
  },
];

function Landing() {
  const { numbers: emergencyNumbers } = useEmergencyNumbers();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={appLogo}
              alt="Thapar Institute logo"
              className="h-14 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/staff-login">Staff login</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Built for {CAMPUS_NAME}
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Campus healthcare,{" "}
              <span className="text-primary">from one place</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Smart Dispensary connects Thapar students with doctors, dispensary appointments,
              emergency ambulance services and medicine delivery — without
              juggling phone numbers, queues and paper prescriptions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">
                  Sign in <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/health-centre">Health Centre & OPD timings</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              24x7 campus ambulance: +91 8288008122 · healthcentre@thapar.edu
            </p>
          </div>

          <div className="border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Health Centre at a glance
            </p>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="border-b border-border pb-4">
                <dt className="text-xs text-muted-foreground">Ambulance (24x7)</dt>
                <dd className="font-display text-xl font-semibold">
                  <a href={`tel:${AMBULANCE_NUMBER.replace(/\s/g, "")}`} className="text-primary">
                    {AMBULANCE_NUMBER}
                  </a>
                </dd>
              </div>
              <div className="border-b border-border pb-4">
                <dt className="text-xs text-muted-foreground">Health Centre email</dt>
                <dd className="font-display text-base font-semibold break-all">
                  <a href={`mailto:${HEALTH_CENTRE_EMAIL}`} className="text-primary">
                    {HEALTH_CENTRE_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">OPD, Monday to Friday</dt>
                <dd className="font-display text-xl font-semibold">24 hours</dd>
              </div>
            </dl>
            <p className="mt-5 text-xs text-muted-foreground">
              Health Centre is open 24 hours on weekdays. See{" "}
              <Link to="/health-centre" className="text-primary underline">
                full OPD timings
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="border-t border-border py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-2xl font-semibold md:text-3xl">What you can do here</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Students, doctors and dispensary staff work off the same system — so appointments,
              stock and emergencies stay in sync.
            </p>
            <dl className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="border-t border-border pt-4">
                  <dt className="text-base font-semibold">{f.title}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{f.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>


        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold">Emergency, without hesitation</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                In an emergency, one tap sends your live location, blood group and emergency contacts
                to the dispensary. If you cannot reach the app, call these numbers directly.
              </p>
              <p className="mt-5 text-sm text-muted-foreground">
                You also get reminders for appointments, medicine refills and campus health alerts.
              </p>
            </div>
            <div className="grid gap-3">
              {emergencyNumbers.map((c) => (
                <a
                  key={c.label}
                  href={`tel:${c.number.replace(/\s/g, "")}`}
                  className="flex items-center justify-between border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="flex items-center gap-2 text-primary">
                    <Phone className="size-4" />
                    {c.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {APP_NAME} · {CAMPUS_NAME} ·{" "}
            <Link to="/health-centre" className="underline">
              Health Centre
            </Link>{" "}
            ·{" "}
            <Link to="/emergency-help" className="underline">
              Emergency numbers
            </Link>
          </p>
          <p>Not a substitute for professional medical care. In a crisis, call 112.</p>
        </div>
      </footer>
    </div>
  );
}
