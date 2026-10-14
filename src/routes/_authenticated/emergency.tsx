import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ambulance, Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
import { useAuthUser, useProfile } from "@/hooks/use-session";
import { AMBULANCE_STAGES, formatStatus } from "@/lib/campus";
import { useEmergencyNumbers } from "@/hooks/use-emergency-numbers";

export const Route = createFileRoute("/_authenticated/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency SOS | Smart Dispensary" },
      {
        name: "description",
        content: "Request a campus ambulance with live location sharing and track its arrival.",
      },
      { property: "og:title", content: "Emergency SOS | Smart Dispensary" },
      { property: "og:description", content: "Campus ambulance request with location tracking." },
    ],
  }),
  component: EmergencyPage,
});

const TYPES = ["accident", "fainting", "breathing_difficulty", "high_fever", "injury", "other"];

function EmergencyPage() {
  const { numbers: emergencyNumbers } = useEmergencyNumbers();
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [type, setType] = useState("other");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ["my-ambulance", user?.id],
    enabled: !!user?.id,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ambulance_requests")
        .select("*")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  function locate() {
    if (!navigator.geolocation) {
      toast.error("Location is not available on this device");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Couldn't get your location. Add a landmark instead.");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const sos = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ambulance_requests").insert({
        student_id: user!.id,
        emergency_type: type,
        location_note: note || profile?.hostel || null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ambulance requested. The dispensary has been alerted.");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["my-ambulance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("ambulance_requests")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("student_id", user!.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Couldn't cancel the request. Please call the dispensary.");
      return data;
    },
    onSuccess: async () => {
      toast.success("Ambulance request cancelled");
      await queryClient.invalidateQueries({ queryKey: ["my-ambulance"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const active = requests?.find(
    (r) => !["completed", "cancelled"].includes(r.status),
  );

  return (
    <AppShell title="Emergency" description="Campus ambulance and urgent help">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">Request an ambulance</CardTitle>
            <CardDescription>
              Your name, blood group and emergency contacts are shared with the dispensary team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type of emergency</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatStatus(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Where are you?</Label>
              <Input
                id="note"
                value={note}
                placeholder={profile?.hostel ?? "Hostel / building / landmark"}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full" onClick={locate} disabled={locating}>
              {locating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <MapPin className="mr-2 size-4" />
              )}
              {coords
                ? `Location shared (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                : "Share my live location"}
            </Button>
            <Button
              size="lg"
              variant="destructive"
              className="w-full"
              disabled={sos.isPending || !!active}
              onClick={() => sos.mutate()}
            >
              {sos.isPending ? (
                <Loader2 className="mr-2 size-5 animate-spin" />
              ) : (
                <Ambulance className="mr-2 size-5" />
              )}
              {active ? "Request already active" : "Send SOS"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Call directly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {emergencyNumbers.map((c) => (
                <a
                  key={c.label}
                  href={`tel:${c.number.replace(/\s/g, "")}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/60"
                >
                  <span>{c.label}</span>
                  <span className="flex items-center gap-1 text-primary">
                    <Phone className="size-3.5" /> {c.number}
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests?.length ? (
                requests.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{formatStatus(r.emergency_type)}</p>
                      <Badge variant={r.status === "completed" ? "outline" : "secondary"}>
                        {formatStatus(r.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                      {r.eta_minutes ? ` · ETA ${r.eta_minutes} min` : ""}
                    </p>
                    <div className="mt-2 flex gap-1">
                      {AMBULANCE_STAGES.map((stage) => {
                        const idx = AMBULANCE_STAGES.indexOf(r.status as never);
                        const reached = idx >= AMBULANCE_STAGES.indexOf(stage);
                        return (
                          <span
                            key={stage}
                            className={`h-1.5 flex-1 rounded-full ${
                              reached ? "bg-primary" : "bg-border"
                            }`}
                          />
                        );
                      })}
                    </div>
                    {!["completed", "cancelled"].includes(r.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 h-8 px-2 text-xs"
                        disabled={cancel.isPending && cancel.variables === r.id}
                        onClick={() => cancel.mutate(r.id)}
                      >
                        {cancel.isPending && cancel.variables === r.id
                          ? "Cancelling…"
                          : "Cancel request"}
                      </Button>
                    )}

                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No emergency requests yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
