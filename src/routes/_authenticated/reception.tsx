import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";
import { SlotSelect } from "@/components/SlotSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-session";
import {
  bookingErrorMessage,
  upcomingDates,
  useDaySlots,
  type DaySlot,
} from "@/hooks/use-day-slots";
import { fetchPeople, personName, type PersonSummary } from "@/lib/people";
import {
  BOOKING_DAYS_AHEAD,
  SLOT_MINUTES,
  addMinutes,
  formatDate,
  formatStatus,
  formatTime,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/reception")({
  head: () => ({ meta: [{ title: "Reception | Smart Dispensary" }] }),
  component: () => (
    <RequireRole roles={["reception", "admin"]} title="Reception">
      <ReceptionDesk />
    </RequireRole>
  ),
});

function ReceptionDesk() {
  const [dates] = useState(() => upcomingDates(BOOKING_DAYS_AHEAD));
  const [date, setDate] = useState(dates[0]!);

  return (
    <AppShell title="Reception" description="Book and cancel appointments for patients">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
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
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <BookForPatient date={date} />
        <DayAppointments date={date} />
      </div>
    </AppShell>
  );
}

function BookForPatient({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { doctors, slotsFor, leaveFor } = useDaySlots(date);
  const [query, setQuery] = useState("");
  const [patient, setPatient] = useState<PersonSummary | null>(null);
  const [doctorId, setDoctorId] = useState("");
  const [slot, setSlot] = useState<DaySlot | null>(null);
  const [reason, setReason] = useState("");

  const term = query.trim();
  const { data: matches, isFetching } = useQuery({
    queryKey: ["patient-search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term.replace(/[%,()]/g, "")}%`;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, student_id, hostel, blood_group")
        .or(`full_name.ilike.${like},email.ilike.${like},student_id.ilike.${like}`)
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  const leave = doctorId ? leaveFor(doctorId) : undefined;

  const book = useMutation({
    mutationFn: async () => {
      if (!patient) throw new Error("Choose a patient");
      if (!doctorId || !slot) throw new Error("Choose a doctor and a slot");
      const { error } = await supabase.from("appointments").insert({
        student_id: patient.id,
        doctor_id: doctorId,
        appointment_date: date,
        start_time: slot.time,
        token_number: slot.token,
        reason: reason.trim() || null,
      });
      if (error) throw new Error(bookingErrorMessage(error));
    },
    onSuccess: () => {
      toast.success(`Booked. ${personName(patient ?? undefined)} has been notified.`);
      setSlot(null);
      setReason("");
      setPatient(null);
      setQuery("");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setSlot(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
      queryClient.invalidateQueries({ queryKey: ["desk-appointments"] });
    },
  });

  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle className="text-base">Book for a patient</CardTitle>
        <CardDescription>Patients must have an account. They get a notification.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Patient</Label>
          {patient ? (
            <div className="flex items-center justify-between rounded-md border border-primary/50 bg-accent/30 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{personName(patient)}</span>
                <span className="block text-xs text-muted-foreground">
                  {[patient.student_id, patient.email, patient.phone].filter(Boolean).join(" · ")}
                </span>
              </span>
              <Button size="icon" variant="ghost" onClick={() => setPatient(null)}>
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Name, email or roll number"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              {term.length >= 2 && matches && (
                <div className="divide-y divide-border rounded-md border border-border">
                  {matches.length === 0 && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No matching patient.</p>
                  )}
                  {matches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/50"
                      onClick={() => setPatient(m)}
                    >
                      <span className="font-medium">{personName(m)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {[m.student_id, m.email].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Doctor</Label>
          <Select
            value={doctorId}
            onValueChange={(v) => {
              setDoctorId(v);
              setSlot(null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                  {leaveFor(d.id) ? " · On leave" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {doctorId && (
          <div className="space-y-1.5">
            <Label>Slot on {formatDate(date)}</Label>
            <SlotSelect
              className="w-full"
              slots={slotsFor(doctorId)}
              disabled={!!leave}
              emptyText={leave ? "Doctor on leave" : "No slots left"}
              value={slot?.time ?? ""}
              onChange={setSlot}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Reason (optional)</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>

        <Button
          className="w-full"
          disabled={!patient || !slot || book.isPending}
          onClick={() => book.mutate()}
        >
          {book.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Book appointment
        </Button>
      </CardContent>
    </Card>
  );
}

function DayAppointments({ date }: { date: string }) {
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["desk-appointments", date],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("appointments")
        .select("*, doctors(name)")
        .eq("appointment_date", date)
        .order("start_time");
      if (error) throw error;
      const people = await fetchPeople((rows ?? []).map((r) => r.student_id));
      return (rows ?? []).map((r) => ({ ...r, patient: people.get(r.student_id) }));
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({
          status: "cancelled",
          cancel_reason: cancelReason.trim() || "Cancelled by the dispensary reception",
          cancelled_by: user!.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment cancelled. Patient notified.");
      setCancelling(null);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ["desk-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Appointments on {formatDate(date)}</CardTitle>
        <CardDescription>
          {data?.filter((a) => a.status === "booked").length ?? 0} booked across all doctors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
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
                  {a.doctors?.name ?? "Doctor"} · Token {a.token_number}
                  {a.patient?.phone ? ` · ${a.patient.phone}` : ""}
                </p>
                {a.status === "cancelled" && a.cancel_reason && (
                  <p className="text-xs text-muted-foreground">{a.cancel_reason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "cancelled" ? "destructive" : "secondary"}>
                  {formatStatus(a.status)}
                </Badge>
                {a.status === "booked" && cancelling !== a.id && (
                  <Button size="sm" variant="ghost" onClick={() => setCancelling(a.id)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            {cancelling === a.id && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Input
                  className="min-w-48 flex-1"
                  placeholder="Reason (sent to the patient)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(a.id)}
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
