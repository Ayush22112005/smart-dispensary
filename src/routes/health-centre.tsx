import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CAMPUS_NAME,
  AMBULANCE_NUMBER,
  HEALTH_CENTRE_EMAIL,
  HEALTH_CENTRE_HEAD,
  HEALTH_CENTRE_DOCTORS,
  HEALTH_CENTRE_STAFF,
  HEALTH_CENTRE_NOTE,
  HEALTH_CENTRE_GOALS,
  HEALTH_CENTRE_FOCUS,
  OPD_TIMINGS,
} from "@/lib/campus";

export const Route = createFileRoute("/health-centre")({
  head: () => ({
    meta: [
      { title: "Health Centre, Doctors & OPD Timings | Smart Dispensary" },
      {
        name: "description",
        content:
          "Thapar Institute Health Centre: doctors and paramedic staff, OPD timings for weekdays and weekends, 24x7 ambulance number and emergency services.",
      },
      { property: "og:title", content: "Health Centre, Doctors & OPD Timings | Smart Dispensary" },
      {
        property: "og:description",
        content: "Meet the Health Centre team, check OPD timings and reach the 24x7 campus ambulance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HealthCentrePage,
});

function HealthCentrePage() {
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-8">
          <Link to="/">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Link>
        </Button>

        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {CAMPUS_NAME}
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Health Centre</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Basic health care, first aid, early referral and 24x7 ambulance support for students and
          staff on campus.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a
            href={`tel:${AMBULANCE_NUMBER.replace(/\s/g, "")}`}
            className="flex items-center gap-2 border border-border bg-card px-4 py-2 hover:border-primary"
          >
            <Phone className="size-4 text-primary" />
            Ambulance (24x7) {AMBULANCE_NUMBER}
          </a>
          <a
            href={`mailto:${HEALTH_CENTRE_EMAIL}`}
            className="flex items-center gap-2 border border-border bg-card px-4 py-2 hover:border-primary"
          >
            <Mail className="size-4 text-primary" />
            {HEALTH_CENTRE_EMAIL}
          </a>
        </div>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">OPD timings</h2>
          <dl className="mt-6 space-y-6">
            {OPD_TIMINGS.map((t) => (
              <div key={t.days} className="grid gap-1 sm:grid-cols-[200px_1fr]">
                <dt className="text-sm font-semibold">{t.days}</dt>
                <dd className="text-sm text-muted-foreground">
                  {t.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted-foreground">{HEALTH_CENTRE_NOTE}</p>
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">Head of Health Centre</h2>
          <div className="mt-5">
            <p className="text-base font-semibold">{HEALTH_CENTRE_HEAD.name}</p>
            <p className="text-sm text-muted-foreground">{HEALTH_CENTRE_HEAD.role}</p>
            <p className="text-sm text-muted-foreground">{HEALTH_CENTRE_HEAD.detail}</p>
            <a
              href={`mailto:${HEALTH_CENTRE_HEAD.email}`}
              className="text-sm text-primary underline"
            >
              {HEALTH_CENTRE_HEAD.email}
            </a>
          </div>
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">Doctors</h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {HEALTH_CENTRE_DOCTORS.map((d) => (
              <li key={d.name} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
                <div>
                  <p className="text-base font-semibold">{d.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.role} · {d.qualification}
                  </p>
                </div>
                {d.experience && (
                  <span className="text-sm text-muted-foreground">{d.experience} experience</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">Paramedic and support staff</h2>
          {HEALTH_CENTRE_STAFF.map((group) => (
            <div key={group.group} className="mt-8">
              <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {group.group}
              </h3>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {group.people.map((p) => (
                  <li
                    key={p.name}
                    className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.role}
                        {p.qualification ? ` · ${p.qualification}` : ""}
                      </p>
                    </div>
                    {p.experience && (
                      <span className="text-sm text-muted-foreground">{p.experience}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">Emergency services</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Emergency cases are attended by the doctor on duty at the Health Centre. Ambulance
            services run 24x7 for transport to a hospital or within campus. Ambulance:{" "}
            <a href={`tel:${AMBULANCE_NUMBER.replace(/\s/g, "")}`} className="text-primary underline">
              {AMBULANCE_NUMBER}
            </a>
            .
          </p>
        </section>

        <section className="mt-14 border-t border-border pt-8">
          <h2 className="text-2xl font-semibold">Goals</h2>
          <dl className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {HEALTH_CENTRE_GOALS.map((g) => (
              <div key={g.title}>
                <dt className="text-base font-semibold">{g.title}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{g.body}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12 text-2xl font-semibold">Main focus areas</h2>
          <dl className="mt-6 grid gap-x-12 gap-y-6 sm:grid-cols-2">
            {HEALTH_CENTRE_FOCUS.map((f) => (
              <div key={f.title} className="border-t border-border pt-4">
                <dt className="text-base font-semibold">{f.title}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{f.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-14 text-center text-sm text-muted-foreground">
          Students can book an OPD slot or request an ambulance after{" "}
          <Link to="/auth" className="text-primary underline">
            signing in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
