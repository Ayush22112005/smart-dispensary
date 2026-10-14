import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";
import { UnavailabilityManager } from "@/components/UnavailabilityManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-session";
import { upcomingDates } from "@/hooks/use-day-slots";
import { fetchPeople, personName, telHref } from "@/lib/people";
import {
  BOOKING_DAYS_AHEAD,
  SLOT_MINUTES,
  addMinutes,
  formatDate,
  formatStatus,
  formatTime,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => ({ meta: [{ title: "Doctor desk | Smart Dispensary" }] }),
  component: () => (
    <RequireRole roles={["doctor"]} title="Doctor desk">
      <DoctorDesk />
    </RequireRole>
  ),
});

function DoctorDesk() {
  const { data: doctor, isLoading } = useQuery({
    queryKey: ["my-doctor-record"],
    queryFn: async () => {
      const { data: id, error } = await supabase.rpc("my_doctor_id");
      if (error) throw error;
      if (!id) return null;
      const { data, error: dErr } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", id)
        .single();
      if (dErr) throw dErr;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Doctor desk">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </AppShell>
    );
  }

  if (!doctor) {
    return (
      <AppShell title="Doctor desk">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="text-base">Your account isn't linked to a doctor yet</CardTitle>
            <CardDescription>
              Ask the admin to open Admin console → Doctors and put your login email on your doctor
              profile. Then reload this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Doctor desk" description={`${doctor.name} · ${doctor.speciality}`}>
      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients">My patients</TabsTrigger>
          <TabsTrigger value="availability">Leave &amp; blocked slots</TabsTrigger>
        </TabsList>
        <TabsContent value="patients" className="pt-4">
          <DoctorAppointments doctorId={doctor.id} />
        </TabsContent>
        <TabsContent value="availability" className="pt-4">
          <UnavailabilityManager doctorId={doctor.id} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function DoctorAppointments({ doctorId }: { doctorId: string }) {
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser();
  const [dates] = useState(() => upcomingDates(BOOKING_DAYS_AHEAD));
  const [date, setDate] = useState(dates[0]!);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-appointments", doctorId, date],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", date)
        .order("start_time");
      if (error) throw error;
      const people = await fetchPeople((rows ?? []).map((r) => r.student_id));
      return (rows ?? []).map((r) => ({ ...r, patient: people.get(r.student_id) }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string; reason?: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: vars.status,
          ...(vars.status === "cancelled"
            ? { cancel_reason: vars.reason || "Cancelled by the doctor", cancelled_by: user!.id }
            : {}),
        })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "cancelled" ? "Appointment cancelled. Patient notified." : "Updated",
      );
      setCancelling(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = data?.filter((a) => a.status !== "cancelled") ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appointments</CardTitle>
        <CardDescription>
          {active.length} booked on {formatDate(date)}. Cancelling notifies the patient.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {dates.map((d, i) => (
            <Button
              key={d}
              size="sm"
              variant={d === date ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setDate(d)}
            >
              {i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(d)}
            </Button>
          ))}
        </div>

        {isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
        {!isLoading && !data?.length && (
          <p className="text-sm text-muted-foreground">No appointments on this day.</p>
        )}

        {data?.map((a) => (
          <div key={a.id} className="rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {formatTime(a.start_time)}–{formatTime(addMinutes(a.start_time, SLOT_MINUTES))} ·{" "}
                  {personName(a.patient)}
                </p>
                <p className="text-muted-foreground">
                  Token {a.token_number}
                  {a.patient?.student_id ? ` · ${a.patient.student_id}` : ""}
                  {a.patient?.blood_group ? ` · ${a.patient.blood_group}` : ""}
                </p>
                {a.reason && <p className="mt-1">“{a.reason}”</p>}
                {a.patient?.phone && (
                  <a
                    href={telHref(a.patient.phone)}
                    className="mt-1 inline-flex items-center gap-1 text-primary"
                  >
                    <Phone className="size-3.5" /> {a.patient.phone}
                  </a>
                )}
              </div>
              <Badge variant={a.status === "cancelled" ? "destructive" : "secondary"}>
                {formatStatus(a.status)}
              </Badge>
            </div>
            {a.status === "cancelled" && a.cancel_reason && (
              <p className="mt-1 text-xs text-muted-foreground">{a.cancel_reason}</p>
            )}

            {a.status === "booked" && cancelling !== a.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: a.id, status: "completed" })}
                >
                  <Check className="mr-1 size-4" /> Seen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: a.id, status: "no_show" })}
                >
                  No show
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelling(a.id)}>
                  <X className="mr-1 size-4" /> Cancel
                </Button>
              </div>
            )}

            {cancelling === a.id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  className="min-w-48 flex-1"
                  placeholder="Reason (sent to the patient)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={setStatus.isPending}
                  onClick={() =>
                    setStatus.mutate({ id: a.id, status: "cancelled", reason: cancelReason.trim() })
                  }
                >
                  Cancel &amp; notify
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCancelling(null)}>
                  Keep
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
