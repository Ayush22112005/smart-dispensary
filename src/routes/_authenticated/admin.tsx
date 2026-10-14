import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ShieldCheck, Save } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MedicinesManager } from "@/components/MedicinesManager";
import { UnavailabilityManager } from "@/components/UnavailabilityManager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRoles, type AppRole } from "@/hooks/use-session";
import {
  DEFAULT_BOOKING_HOURS,
  SLOT_MINUTES,
  buildSlotTimes,
  formatDate,
  NOTICE_CATEGORIES,
  formatTime,
} from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | Smart Dispensary" },
      {
        name: "description",
        content:
          "Manage campus doctors, dispensary medicine stock, emergency numbers, clinic slots and staff roles.",
      },
      { property: "og:title", content: "Admin Console | Smart Dispensary" },
      {
        property: "og:description",
        content: "Control panel for the Thapar campus dispensary platform.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: roles, isLoading } = useRoles();
  const queryClient = useQueryClient();
  const isAdmin = roles?.includes("admin");

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: (granted) => {
      if (granted) {
        toast.success("You are now the campus admin");
        queryClient.invalidateQueries();
      } else {
        toast.error("An admin already exists. Ask them to grant you access.");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell title="Admin console">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Admin console" description="Restricted area">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-primary" /> Admin access required
            </CardTitle>
            <CardDescription>
              This console manages doctors, medicine stock, emergency numbers and staff roles.
              If nobody has claimed the admin account yet, you can claim it once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => claim.mutate()} disabled={claim.isPending}>
              {claim.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Claim admin access
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin console" description="Manage the campus dispensary">
      <Tabs defaultValue="doctors">
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="doctors">Doctors</TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="leave">Doctor leave</TabsTrigger>
          <TabsTrigger value="medicines">Medicines</TabsTrigger>
          <TabsTrigger value="emergency">Emergency numbers</TabsTrigger>
          <TabsTrigger value="alerts">Notices</TabsTrigger>
          <TabsTrigger value="roles">People &amp; roles</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="pt-4">
          <DoctorsAdmin />
        </TabsContent>
        <TabsContent value="slots" className="pt-4">
          <SlotsAdmin />
        </TabsContent>
        <TabsContent value="leave" className="pt-4">
          <UnavailabilityManager />
        </TabsContent>
        <TabsContent value="medicines" className="pt-4">
          <MedicinesManager />
        </TabsContent>
        <TabsContent value="emergency" className="pt-4">
          <EmergencyAdmin />
        </TabsContent>
        <TabsContent value="alerts" className="pt-4">
          <AlertsAdmin />
        </TabsContent>
        <TabsContent value="roles" className="pt-4">
          <RolesAdmin />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function useAdminMutation(keys: string[], fn: (vars: never) => Promise<unknown>, message: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      keys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      toast.success(message);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------------------------- Doctors --------------------------------- */

function DoctorsAdmin() {
  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [name, setName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [qualification, setQualification] = useState("");
  const [email, setEmail] = useState("");

  const create = useAdminMutation(["admin-doctors", "doctors"], async () => {
    const { error } = await supabase.from("doctors").insert({
      name,
      speciality,
      qualification: qualification || null,
      email: email.trim().toLowerCase() || null,
    });
    if (error) throw error;
  }, "Doctor added");

  const update = useAdminMutation(
    ["admin-doctors", "doctors"],
    async (vars: never) => {
      const { id, patch } = vars as unknown as { id: string; patch: Record<string, unknown> };
      const { error } = await supabase.from("doctors").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    "Doctor updated",
  );

  const remove = useAdminMutation(
    ["admin-doctors", "doctors"],
    async (id: never) => {
      const { error } = await supabase.from("doctors").delete().eq("id", id as unknown as string);
      if (error) throw error;
    },
    "Doctor removed",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a doctor</CardTitle>
          <CardDescription>
            New doctors appear instantly in student booking. The login email links the doctor to
            their Doctor desk (also give that account the doctor role under People &amp; roles).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. A. Sharma" />
          </div>
          <div className="space-y-1.5">
            <Label>Speciality</Label>
            <Input
              value={speciality}
              onChange={(e) => setSpeciality(e.target.value)}
              placeholder="General Physician"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Qualification</Label>
            <Input
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="MBBS, MD"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Login email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@thapar.edu"
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!name.trim() || !speciality.trim() || create.isPending}
              onClick={() => {
                create.mutate(undefined as never, {
                  onSuccess: () => {
                    setName("");
                    setSpeciality("");
                    setQualification("");
                    setEmail("");
                  },
                });
              }}
            >
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {doctors?.map((doc) => (
          <DoctorRow
            key={doc.id}
            doctor={doc}
            onSave={(patch) => update.mutate({ id: doc.id, patch } as never)}
            onDelete={() => remove.mutate(doc.id as never)}
          />
        ))}
      </div>
    </div>
  );
}

type DoctorRecord = {
  id: string;
  name: string;
  speciality: string;
  qualification: string | null;
  bio: string | null;
  email: string | null;
  available_online: boolean;
  is_active: boolean;
};

function DoctorRow({
  doctor,
  onSave,
  onDelete,
}: {
  doctor: DoctorRecord;
  onSave: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(doctor.name);
  const [speciality, setSpeciality] = useState(doctor.speciality);
  const [qualification, setQualification] = useState(doctor.qualification ?? "");
  const [email, setEmail] = useState(doctor.email ?? "");

  return (
    <Card>
      <CardContent className="grid gap-3 pt-6 sm:grid-cols-5">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Speciality</Label>
          <Input value={speciality} onChange={(e) => setSpeciality(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Qualification</Label>
          <Input value={qualification} onChange={(e) => setQualification(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Login email</Label>
          <Input
            type="email"
            value={email}
            placeholder="Links the Doctor desk"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            size="sm"
            onClick={() =>
              onSave({
                name,
                speciality,
                qualification: qualification || null,
                email: email.trim().toLowerCase() || null,
              })
            }
          >
            <Save className="mr-1 size-4" /> Save
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-6 sm:col-span-5">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={doctor.is_active}
              onCheckedChange={(v) => onSave({ is_active: v })}
            />
            Accepting patients
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={doctor.available_online}
              onCheckedChange={(v) => onSave({ available_online: v })}
            />
            Online consults
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

/* ----------------------------------- Slots ---------------------------------- */

function SlotsAdmin() {
  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: slots } = useQuery({
    queryKey: ["admin-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_slots")
        .select("*, doctors(name)")
        .gte("slot_date", new Date().toISOString().slice(0, 10))
        .order("slot_date")
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("13:00");

  const create = useAdminMutation(["admin-slots", "slots"], async () => {
    if (end <= start) throw new Error("End time must be after start time");
    const { error } = await supabase.from("doctor_slots").insert({
      doctor_id: doctorId,
      slot_date: date,
      start_time: start,
      end_time: end,
    });
    if (error) throw error;
  }, "Availability added");

  const remove = useAdminMutation(
    ["admin-slots", "slots"],
    async (id: never) => {
      const { error } = await supabase
        .from("doctor_slots")
        .delete()
        .eq("id", id as unknown as string);
      if (error) throw error;
    },
    "Availability removed",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add doctor availability</CardTitle>
          <CardDescription>
            Split into {SLOT_MINUTES}-minute slots, one student each. A doctor with no availability on a
            day uses the default hours ({DEFAULT_BOOKING_HOURS.map((h) => `${formatTime(h.start)}–${formatTime(h.end)}`).join(", ")}).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-5">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Doctor</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
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
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="sm:col-span-5">
            <Button disabled={!doctorId || create.isPending} onClick={() => create.mutate(undefined as never)}>
              <Plus className="mr-1 size-4" /> Add availability
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slots?.length === 0 && (
            <p className="text-sm text-muted-foreground">No availability added. Default hours apply.</p>
          )}
          {slots?.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">
                  {(slot as { doctors?: { name: string } }).doctors?.name ?? "Doctor"}
                </span>{" "}
                · {formatDate(slot.slot_date)} · {formatTime(slot.start_time)}–{formatTime(slot.end_time)}
              </span>
              <span className="flex items-center gap-3">
                <Badge variant="secondary">
                  {buildSlotTimes([{ start: slot.start_time, end: slot.end_time }]).length} slots
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(slot.id as never)}>
                  <Trash2 className="size-4" />
                </Button>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------- Emergency numbers ---------------------------- */

function EmergencyAdmin() {
  const { data: numbers } = useQuery({
    queryKey: ["admin-emergency-numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_numbers")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [label, setLabel] = useState("");
  const [phone, setPhone] = useState("");

  const keys = ["admin-emergency-numbers", "emergency-numbers"];

  const create = useAdminMutation(keys, async () => {
    const { error } = await supabase.from("emergency_numbers").insert({
      label,
      phone,
      sort_order: (numbers?.length ?? 0) + 1,
    });
    if (error) throw error;
  }, "Emergency number added");

  const update = useAdminMutation(
    keys,
    async (vars: never) => {
      const { id, patch } = vars as unknown as { id: string; patch: Record<string, unknown> };
      const { error } = await supabase.from("emergency_numbers").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    "Emergency number updated",
  );

  const remove = useAdminMutation(
    keys,
    async (id: never) => {
      const { error } = await supabase
        .from("emergency_numbers")
        .delete()
        .eq("id", id as unknown as string);
      if (error) throw error;
    },
    "Emergency number removed",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add an emergency number</CardTitle>
          <CardDescription>
            These numbers show on the landing page, emergency page and student profiles.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Campus Ambulance" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 175 ..." />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!label.trim() || !phone.trim() || create.isPending}
              onClick={() =>
                create.mutate(undefined as never, {
                  onSuccess: () => {
                    setLabel("");
                    setPhone("");
                  },
                })
              }
            >
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {numbers?.map((row) => (
          <EmergencyRow
            key={row.id}
            row={row}
            onSave={(patch) => update.mutate({ id: row.id, patch } as never)}
            onDelete={() => remove.mutate(row.id as never)}
          />
        ))}
      </div>
    </div>
  );
}

type EmergencyRecord = {
  id: string;
  label: string;
  phone: string;
  is_active: boolean;
};

function EmergencyRow({
  row,
  onSave,
  onDelete,
}: {
  row: EmergencyRecord;
  onSave: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(row.label);
  const [phone, setPhone] = useState(row.phone);

  return (
    <Card>
      <CardContent className="grid gap-3 pt-6 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 sm:pt-6">
          <Switch checked={row.is_active} onCheckedChange={(v) => onSave({ is_active: v })} />
          <span className="text-sm">Visible</span>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button size="sm" onClick={() => onSave({ label, phone })}>
            <Save className="mr-1 size-4" /> Save
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* --------------------------------- Alerts ----------------------------------- */

function AlertsAdmin() {
  const { data: alerts } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [severity, setSeverity] = useState("info");
  const [category, setCategory] = useState("dispensary");

  const create = useAdminMutation(["admin-alerts", "alerts", "health-alerts"], async () => {
    const { error } = await supabase
      .from("health_alerts")
      .insert({ title, body, severity, category });
    if (error) throw error;
  }, "Alert published");

  const remove = useAdminMutation(
    ["admin-alerts", "alerts", "health-alerts"],
    async (id: never) => {
      const { error } = await supabase
        .from("health_alerts")
        .delete()
        .eq("id", id as unknown as string);
      if (error) throw error;
    },
    "Alert removed",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post a notice</CardTitle>
          <CardDescription>
            Shown to everyone on their dashboard: dispensary updates, health concerns going around
            campus, or a doctor being unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NOTICE_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button
            disabled={!title.trim() || !body.trim() || create.isPending}
            onClick={() =>
              create.mutate(undefined as never, {
                onSuccess: () => {
                  setTitle("");
                  setBody("");
                },
              })
            }
          >
            <Plus className="mr-1 size-4" /> Publish
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {alerts?.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div>
              <p className="text-sm font-medium">
                {a.title}{" "}
                <Badge variant="outline">
                  {NOTICE_CATEGORIES[a.category as keyof typeof NOTICE_CATEGORIES] ?? a.category}
                </Badge>{" "}
                <Badge variant="secondary">{a.severity}</Badge>
              </p>
              <p className="text-sm text-muted-foreground">{a.body}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id as never)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- Roles ------------------------------------ */

const ROLES: AppRole[] = [
  "student",
  "doctor",
  "reception",
  "ambulance",
  "chemist",
  "staff",
  "admin",
];

function RolesAdmin() {
  const { data: people } = useQuery({
    queryKey: ["admin-people"],
    queryFn: async () => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, student_id").order("full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });

  const grant = useAdminMutation(
    ["admin-people", "roles"],
    async (vars: never) => {
      const { userId, role } = vars as unknown as { userId: string; role: AppRole };
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    "Role granted",
  );

  const revoke = useAdminMutation(
    ["admin-people", "roles"],
    async (vars: never) => {
      const { userId, role } = vars as unknown as { userId: string; role: AppRole };
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    "Role revoked",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">People &amp; roles</CardTitle>
        <CardDescription>
          Give registered accounts their role: doctor, reception, ambulance crew, chemist or admin.
          Each role unlocks its desk in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {people?.map((person) => (
          <div key={person.id} className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium">{person.full_name || "Unnamed"}</p>
            <p className="text-xs text-muted-foreground">
              {person.email} {person.student_id ? `· ${person.student_id}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLES.map((role) => {
                const has = person.roles.includes(role);
                return (
                  <Button
                    key={role}
                    size="sm"
                    variant={has ? "default" : "outline"}
                    onClick={() =>
                      has
                        ? revoke.mutate({ userId: person.id, role } as never)
                        : grant.mutate({ userId: person.id, role } as never)
                    }
                  >
                    {role}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
