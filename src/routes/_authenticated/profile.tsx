import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone, Plus, Save, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProfile } from "@/hooks/use-session";
import { BLOOD_GROUPS, HOSTELS } from "@/lib/campus";
import { useEmergencyNumbers } from "@/hooks/use-emergency-numbers";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | Smart Dispensary" },
      {
        name: "description",
        content:
          "Manage your personal medical details, hostel address and emergency phone numbers for campus healthcare.",
      },
      { property: "og:title", content: "My Profile | Smart Dispensary" },
      {
        property: "og:description",
        content: "Personal details and emergency contacts for the Thapar campus dispensary.",
      },
    ],
  }),
  component: ProfilePage,
});

type Form = {
  full_name: string;
  phone: string;
  student_id: string;
  branch: string;
  year: string;
  hostel: string;
  blood_group: string;
  allergies: string;
  chronic_conditions: string;
};

const EMPTY: Form = {
  full_name: "",
  phone: "",
  student_id: "",
  branch: "",
  year: "",
  hostel: "",
  blood_group: "",
  allergies: "",
  chronic_conditions: "",
};

function ProfilePage() {
  const { numbers: emergencyNumbers } = useEmergencyNumbers();
  const { data: user } = useAuthUser();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [contact, setContact] = useState({ name: "", phone: "", relation: "" });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      phone: profile.phone ?? "",
      student_id: profile.student_id ?? "",
      branch: profile.branch ?? "",
      year: profile.year ?? "",
      hostel: profile.hostel ?? "",
      blood_group: profile.blood_group ?? "",
      allergies: profile.allergies ?? "",
      chronic_conditions: profile.chronic_conditions ?? "",
    });
  }, [profile]);

  const { data: contacts } = useQuery({
    queryKey: ["emergency-contacts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Full name is required");
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user!.id,
          email: user!.email ?? "",
          full_name: form.full_name.trim(),
          phone: form.phone.trim() || null,
          student_id: form.student_id.trim() || null,
          branch: form.branch.trim() || null,
          year: form.year || null,
          hostel: form.hostel || null,
          blood_group: form.blood_group || null,
          allergies: form.allergies.trim() || null,
          chronic_conditions: form.chronic_conditions.trim() || null,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addContact = useMutation({
    mutationFn: async () => {
      if (!contact.name.trim() || !contact.phone.trim())
        throw new Error("Contact name and phone are required");
      const { error } = await supabase.from("emergency_contacts").insert({
        user_id: user!.id,
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        relation: contact.relation.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContact({ name: "", phone: "", relation: "" });
      toast.success("Emergency contact added");
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact removed");
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell title="My profile" description="Personal details, medical info and emergency contacts">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-primary" /> Personal details
            </CardTitle>
            <CardDescription>
              Doctors see this during consultations and emergencies. Keep it accurate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading your profile…
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={form.full_name}
                      onChange={(e) => set("full_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email ?? ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile number</Label>
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="+91 …"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roll">Roll / student ID</Label>
                    <Input
                      id="roll"
                      value={form.student_id}
                      onChange={(e) => set("student_id", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      placeholder="COE, ECE, ME…"
                      value={form.branch}
                      onChange={(e) => set("branch", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={form.year} onValueChange={(v) => set("year", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3", "4", "5", "PG"].map((y) => (
                          <SelectItem key={y} value={y}>
                            {y === "PG" ? "Postgraduate" : `Year ${y}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hostel / residence</Label>
                    <Select value={form.hostel} onValueChange={(v) => set("hostel", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {HOSTELS.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Blood group</Label>
                    <Select value={form.blood_group} onValueChange={(v) => set("blood_group", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    rows={2}
                    placeholder="Penicillin, dust, peanuts…"
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronic">Chronic conditions</Label>
                  <Textarea
                    id="chronic"
                    rows={2}
                    placeholder="Asthma, diabetes, thyroid…"
                    value={form.chronic_conditions}
                    onChange={(e) => set("chronic_conditions", e.target.value)}
                  />
                </div>

                <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
                  {save.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Save profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Phone className="size-4 text-primary" /> My emergency contacts
              </CardTitle>
              <CardDescription>Called first if you raise an SOS on campus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts?.length ? (
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.phone}
                          {c.relation ? ` · ${c.relation}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`}>
                            <Phone className="size-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContact.mutate(c.id)}
                          aria-label={`Remove ${c.name}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No emergency contacts yet. Add a parent, guardian or hostel warden.
                </p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />
                <Input
                  placeholder="Phone"
                  inputMode="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />
              </div>
              <Input
                placeholder="Relation (father, warden, friend…)"
                value={contact.relation}
                onChange={(e) => setContact({ ...contact, relation: e.target.value })}
              />
              <Button
                variant="secondary"
                className="w-full"
                disabled={addContact.isPending}
                onClick={() => addContact.mutate()}
              >
                {addContact.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Add contact
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campus emergency numbers</CardTitle>
              <CardDescription>Available 24×7.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyNumbers.map((c) => (
                <a
                  key={c.number}
                  href={`tel:${c.number.replace(/\s/g, "")}`}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground">{c.number}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
