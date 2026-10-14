import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarOff, Clock, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { formatDate, formatTime, localDateKey } from "@/lib/campus";

type Kind = "leave" | "busy";

/**
 * Leave (whole days) and blocked time for doctors. With `doctorId` it manages that one
 * doctor (doctor desk); without it, the admin picks the doctor.
 */
export function UnavailabilityManager({ doctorId }: { doctorId?: string }) {
  const queryClient = useQueryClient();
  const today = localDateKey(new Date());

  const [pickedDoctor, setPickedDoctor] = useState("");
  const target = doctorId ?? pickedDoctor;
  const [kind, setKind] = useState<Kind>("leave");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState("");

  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors"],
    enabled: !doctorId,
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["doctor-unavailability", "list", doctorId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("doctor_unavailability")
        .select("*, doctors(name)")
        .gte("end_date", today)
        .order("start_date")
        .order("start_time");
      if (doctorId) q = q.eq("doctor_id", doctorId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const onLeaveToday = entries?.find(
    (e) => e.doctor_id === doctorId && !e.start_time && e.start_date <= today,
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor-unavailability"] });
    queryClient.invalidateQueries({ queryKey: ["booked-slots"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
    queryClient.invalidateQueries({ queryKey: ["desk-appointments"] });
  };

  const add = useMutation({
    mutationFn: async (input: {
      kind: Kind;
      start_date: string;
      end_date: string;
      start_time: string | null;
      end_time: string | null;
      reason: string | null;
    }) => {
      if (!target) throw new Error("Choose a doctor");
      if (input.end_date < input.start_date) throw new Error("End date is before start date");
      if (input.start_time && input.end_time && input.end_time <= input.start_time)
        throw new Error("End time must be after start time");
      const { error } = await supabase
        .from("doctor_unavailability")
        .insert({ doctor_id: target, ...input });
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      toast.success(
        input.kind === "leave"
          ? "Leave added. Booked patients were cancelled and notified."
          : "Time blocked. Booked patients in that time were cancelled and notified.",
      );
      setReason("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doctor_unavailability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed. Those slots are open for booking again.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {doctorId && (
        <Card className={onLeaveToday ? "border-destructive/50" : undefined}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium">
                {onLeaveToday ? "You are marked on leave today" : "You are available today"}
              </p>
              <p className="text-xs text-muted-foreground">
                {onLeaveToday
                  ? "Students see you as “On leave” and cannot book you."
                  : "Going on leave cancels today's bookings and notifies those patients."}
              </p>
            </div>
            {onLeaveToday ? (
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => remove.mutate(onLeaveToday.id)}
              >
                I'm back – end leave
              </Button>
            ) : (
              <Button
                variant="destructive"
                disabled={add.isPending}
                onClick={() =>
                  add.mutate({
                    kind: "leave",
                    start_date: today,
                    end_date: today,
                    start_time: null,
                    end_time: null,
                    reason: null,
                  })
                }
              >
                <CalendarOff className="mr-2 size-4" /> On leave today
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {doctorId ? "Plan leave or block slots" : "Mark a doctor unavailable"}
          </CardTitle>
          <CardDescription>
            Students see this immediately. Anyone already booked in that time is cancelled and
            notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={kind === "leave" ? "default" : "outline"}
              onClick={() => setKind("leave")}
            >
              <CalendarOff className="mr-1.5 size-4" /> Leave (full days)
            </Button>
            <Button
              size="sm"
              variant={kind === "busy" ? "default" : "outline"}
              onClick={() => setKind("busy")}
            >
              <Clock className="mr-1.5 size-4" /> Block time (busy)
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {!doctorId && (
              <div className="space-y-1.5 sm:col-span-4">
                <Label>Doctor</Label>
                <Select value={pickedDoctor} onValueChange={setPickedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{kind === "leave" ? "From" : "Date"}</Label>
              <Input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (kind === "busy" || endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </div>
            {kind === "leave" ? (
              <div className="space-y-1.5">
                <Label>To</Label>
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </>
            )}
            <div className={`space-y-1.5 ${kind === "leave" ? "sm:col-span-2" : ""}`}>
              <Label>Reason (shown to students)</Label>
              <Input
                value={reason}
                placeholder={kind === "leave" ? "Personal leave" : "In a meeting"}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <Button
            disabled={add.isPending || !target}
            onClick={() =>
              add.mutate({
                kind,
                start_date: startDate,
                end_date: kind === "leave" ? endDate : startDate,
                start_time: kind === "busy" ? startTime : null,
                end_time: kind === "busy" ? endTime : null,
                reason: reason.trim() || null,
              })
            }
          >
            {add.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {kind === "leave" ? "Add leave" : "Block this time"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming leave and blocked time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!entries?.length && (
            <p className="text-sm text-muted-foreground">Nothing planned. All slots are open.</p>
          )}
          {entries?.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {!doctorId && <span>{e.doctors?.name ?? "Doctor"} · </span>}
                  {e.start_date === e.end_date
                    ? formatDate(e.start_date)
                    : `${formatDate(e.start_date)} – ${formatDate(e.end_date)}`}
                  {e.start_time && e.end_time
                    ? ` · ${formatTime(e.start_time)}–${formatTime(e.end_time)}`
                    : ""}
                </p>
                {e.reason && <p className="truncate text-xs text-muted-foreground">{e.reason}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={e.kind === "leave" ? "destructive" : "secondary"}>
                  {e.kind === "leave" ? "Leave" : "Blocked"}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Remove"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(e.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
