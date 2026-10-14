import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, CalendarClock, Pill, Bot, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProfile } from "@/hooks/use-session";
import {
  NOTICE_CATEGORIES,
  formatDate,
  formatStatus,
  formatTime,
  localDateKey,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Smart Dispensary" },
      {
        name: "description",
        content: "Your campus health overview: upcoming appointments, active requests and alerts.",
      },
      { property: "og:title", content: "Dashboard | Smart Dispensary" },
      { property: "og:description", content: "Campus health overview for Thapar students." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  {
    to: "/consult",
    label: "Talk to a doctor",
    hint: "Chat now, video if needed",
    icon: Stethoscope,
  },
  {
    to: "/appointments",
    label: "Book an OPD slot",
    hint: "Get a token number",
    icon: CalendarClock,
  },
  { to: "/medicines", label: "Order medicines", hint: "Delivered to your hostel", icon: Pill },
  { to: "/assistant", label: "Ask the assistant", hint: "Is this worth a visit?", icon: Bot },
];

function Dashboard() {
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();

  const { data: appointments } = useQuery({
    queryKey: ["my-appointments-upcoming", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(name, speciality)")
        .eq("student_id", user!.id)
        .gte("appointment_date", localDateKey(new Date()))
        .neq("status", "cancelled")
        .order("appointment_date")
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["my-medicine-requests-active", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_requests")
        .select("*")
        .eq("student_id", user!.id)
        .neq("status", "delivered")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["health-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const today = localDateKey(new Date());
  const { data: awayToday } = useQuery({
    queryKey: ["doctor-unavailability", "today", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_unavailability")
        .select("*, doctors(name)")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_time", { nullsFirst: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";

  const next = appointments?.[0];
  const later = appointments?.slice(1) ?? [];

  return (
    <AppShell title={`Hello, ${firstName}`} description={todayLabel()}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="rounded-md border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="eyebrow font-sans">Next appointment</h2>
            <Link to="/appointments" className="text-xs font-medium text-primary hover:underline">
              All appointments
            </Link>
          </div>
          {next ? (
            <div className="grid gap-6 px-5 py-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="sm:border-r sm:border-border sm:pr-8">
                <p className="text-xs text-muted-foreground">Token</p>
                <p className="figures text-5xl font-medium leading-none text-primary">
                  {next.token_number}
                </p>
              </div>
              <div>
                <p className="font-display text-xl font-semibold">
                  {next.doctors?.name ?? "Doctor"}
                </p>
                {next.doctors?.speciality && (
                  <p className="text-sm text-muted-foreground">{next.doctors.speciality}</p>
                )}
                <p className="mt-3 text-sm">
                  {formatDate(next.appointment_date)}
                  <span className="mx-2 text-muted-foreground">/</span>
                  <span className="figures">{formatTime(next.start_time)}</span>
                  <Badge variant="secondary" className="ml-3 align-middle">
                    {formatStatus(next.status)}
                  </Badge>
                </p>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8">
              <p className="font-display text-lg font-semibold">Nothing booked.</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Pick a doctor and a time and you'll get a token number to track the queue.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link to="/appointments">Book a slot</Link>
              </Button>
            </div>
          )}
          {later.length > 0 && (
            <ul className="border-t border-border text-sm">
              {later.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5 last:border-b-0"
                >
                  <span className="truncate">{a.doctors?.name ?? "Doctor"}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {formatDate(a.appointment_date)} ·{" "}
                    <span className="figures">{formatTime(a.start_time)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <nav aria-label="Quick actions">
          <ul className="divide-y divide-border border-y border-border">
            {quickActions.map((a) => (
              <li key={a.to}>
                <Link
                  to={a.to as never}
                  className="group flex items-center gap-4 px-1 py-3 transition-colors hover:bg-accent/60"
                >
                  <a.icon className="size-[18px] shrink-0 text-muted-foreground group-hover:text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{a.label}</span>
                    <span className="block text-xs text-muted-foreground">{a.hint}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between border-b border-foreground/80 pb-2">
            <h2 className="text-lg">Medicine orders</h2>
            <Link to="/medicines" className="text-xs font-medium text-primary hover:underline">
              New order
            </Link>
          </div>
          {requests?.length ? (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{formatStatus(r.status)}</p>
                    <p className="truncate text-muted-foreground">To {r.delivery_address}</p>
                  </div>
                  <span className="figures shrink-0 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-IN")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No orders in progress.</p>
          )}
        </section>

        <section>
          <div className="border-b border-foreground/80 pb-2">
            <h2 className="text-lg">Notices from the Health Centre</h2>
          </div>
          {!!awayToday?.length && (
            <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
              <p className="font-medium">Doctors unavailable today</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                {awayToday.map((u) => (
                  <li key={u.id}>
                    {u.doctors?.name ?? "Doctor"} ·{" "}
                    {u.start_time && u.end_time
                      ? `busy ${formatTime(u.start_time)}–${formatTime(u.end_time)}`
                      : "on leave"}
                    {u.reason ? ` (${u.reason})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alerts?.length ? (
            <ul className="divide-y divide-border">
              {alerts.map((al) => (
                <li key={al.id} className="py-3 text-sm">
                  <p className="flex items-center gap-2 font-medium">
                    {al.severity !== "info" && (
                      <span className="rounded-sm bg-primary/10 px-1.5 py-px text-[0.6875rem] font-semibold uppercase tracking-wide text-primary">
                        Important
                      </span>
                    )}
                    {al.title}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {NOTICE_CATEGORIES[al.category as keyof typeof NOTICE_CATEGORIES] ??
                      al.category}
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{al.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No notices right now.</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
