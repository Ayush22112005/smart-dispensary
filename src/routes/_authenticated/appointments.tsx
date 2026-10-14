import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { SlotSelect } from "@/components/SlotSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-session";
import { bookingErrorMessage, isOpen, upcomingDates, useDaySlots } from "@/hooks/use-day-slots";
import {
  BOOKING_DAYS_AHEAD,
  SLOT_MINUTES,
  addMinutes,
  formatDate,
  formatStatus,
  formatTime,
  localDateKey,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments | Smart Dispensary" },
      {
        name: "description",
        content:
          "Book a 20-minute dispensary slot with a campus doctor and track your queue token.",
      },
      { property: "og:title", content: "Appointments | Smart Dispensary" },
      { property: "og:description", content: "Book dispensary slots and track queue tokens." },
    ],
  }),
  component: AppointmentsPage,
});

type Selection = { doctorId: string; time: string; token: number };

function AppointmentsPage() {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();

  const [dates] = useState(() => upcomingDates(BOOKING_DAYS_AHEAD));
  const [date, setDate] = useState(dates[0]!);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [reason, setReason] = useState("");

  const { doctors, isLoading, slotsFor, leaveFor } = useDaySlots(date);

  const { data: mine } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(name, speciality)")
        .eq("student_id", user!.id)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refreshSlots = () => {
    queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
    queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
  };

  const book = useMutation({
    mutationFn: async (s: Selection) => {
      const { error } = await supabase.from("appointments").insert({
        student_id: user!.id,
        doctor_id: s.doctorId,
        appointment_date: date,
        start_time: s.time,
        reason: reason || null,
        token_number: s.token,
      });
      if (error) throw new Error(bookingErrorMessage(error));
    },
    onSuccess: () => {
      toast.success("Appointment booked");
      setSelected(null);
      setReason("");
      refreshSlots();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setSelected(null);
      refreshSlots();
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled", cancelled_by: user!.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment cancelled");
      refreshSlots();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedDoctor = doctors?.find((d) => d.id === selected?.doctorId);
  const today = localDateKey(new Date());

  return (
    <AppShell title="Appointments" description="Book a slot at the campus dispensary">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Book a slot</CardTitle>
            <CardDescription>
              Each slot is {SLOT_MINUTES} minutes and can be booked by one student only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((d, i) => (
                <Button
                  key={d}
                  size="sm"
                  variant={d === date ? "default" : "outline"}
                  className="shrink-0"
                  onClick={() => {
                    setDate(d);
                    setSelected(null);
                  }}
                >
                  {i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDate(d)}
                </Button>
              ))}
            </div>

            {isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

            {doctors?.length === 0 && (
              <p className="text-sm text-muted-foreground">No doctors available.</p>
            )}

            {doctors?.map((d) => {
              const slots = slotsFor(d.id);
              const open = slots.filter(isOpen).length;
              const leave = leaveFor(d.id);
              return (
                <div key={d.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-muted-foreground">
                        {d.speciality}
                        {d.qualification ? ` · ${d.qualification}` : ""}
                      </p>
                      {leave && (
                        <p className="mt-1 text-xs text-destructive">
                          On leave{leave.reason ? ` · ${leave.reason}` : ""}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={leave ? "destructive" : open ? "secondary" : "outline"}
                      className="shrink-0"
                    >
                      {leave ? "On leave" : open ? `${open} open` : "Fully booked"}
                    </Badge>
                  </div>
                  <SlotSelect
                    slots={slots}
                    disabled={!!leave}
                    emptyText={leave ? "Doctor on leave" : "No slots left"}
                    value={selected?.doctorId === d.id ? selected.time : ""}
                    onChange={(s) => setSelected({ doctorId: d.id, time: s.time, token: s.token })}
                  />
                </div>
              );
            })}

            {selected && (
              <div className="sticky bottom-3 space-y-3 rounded-md border border-primary/40 bg-card p-4 shadow-lg">
                <p className="text-sm">
                  <span className="font-medium">{selectedDoctor?.name}</span> · {formatDate(date)} ·{" "}
                  {formatTime(selected.time)}–{formatTime(addMinutes(selected.time, SLOT_MINUTES))}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for visit (optional)</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    placeholder="Fever since two days, sore throat..."
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={book.isPending}
                    onClick={() => book.mutate(selected)}
                  >
                    {book.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Confirm booking
                  </Button>
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle className="text-base">My appointments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mine?.length ? (
              mine.map((a) => (
                <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{a.doctors?.name ?? "Doctor"}</p>
                    <Badge variant="secondary">Token {a.token_number}</Badge>
                  </div>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {formatDate(a.appointment_date)} · {formatTime(a.start_time)}–
                    {formatTime(addMinutes(a.start_time, SLOT_MINUTES))}
                  </p>
                  <p
                    className={`mt-1 text-xs ${a.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {formatStatus(a.status)}
                    {a.cancel_reason ? ` · ${a.cancel_reason}` : ""}
                  </p>
                  {a.status === "booked" && a.appointment_date >= today && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2 h-8 px-2 text-xs"
                      disabled={cancel.isPending}
                      onClick={() => cancel.mutate(a.id)}
                    >
                      Cancel appointment
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nothing booked yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
