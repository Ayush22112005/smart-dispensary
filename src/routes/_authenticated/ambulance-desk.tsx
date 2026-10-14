import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchPeople, personName, telHref } from "@/lib/people";
import { AMBULANCE_STAGES, formatStatus } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/ambulance-desk")({
  head: () => ({ meta: [{ title: "Ambulance desk | Smart Dispensary" }] }),
  component: () => (
    <RequireRole roles={["ambulance", "admin"]} title="Ambulance desk">
      <AmbulanceDesk />
    </RequireRole>
  ),
});

const CLOSED = ["completed", "cancelled"];

function AmbulanceDesk() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ambulance-desk"],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("ambulance_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.student_id);
      const [people, contacts] = await Promise.all([
        fetchPeople(ids),
        ids.length
          ? supabase
              .from("emergency_contacts")
              .select("user_id, name, relation, phone")
              .in("user_id", [...new Set(ids)])
              .then(({ data: c, error: cErr }) => {
                if (cErr) throw cErr;
                return c ?? [];
              })
          : Promise.resolve([]),
      ]);
      return (rows ?? []).map((r) => ({
        ...r,
        caller: people.get(r.student_id),
        contacts: contacts.filter((c) => c.user_id === r.student_id),
      }));
    },
  });

  const advance = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ambulance_requests")
        .update({ status: vars.status })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Marked ${formatStatus(vars.status).toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: ["ambulance-desk"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = data?.filter((r) => !CLOSED.includes(r.status)) ?? [];
  const closed = data?.filter((r) => CLOSED.includes(r.status)) ?? [];

  return (
    <AppShell title="Ambulance desk" description="Live SOS requests from students">
      {isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}

      <h2 className="mb-3 text-lg">Active calls ({open.length})</h2>
      {!isLoading && !open.length && (
        <p className="mb-6 text-sm text-muted-foreground">No active ambulance requests.</p>
      )}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {open.map((r) => {
          const idx = AMBULANCE_STAGES.indexOf(r.status as never);
          const next = AMBULANCE_STAGES[idx + 1];
          const mapUrl =
            r.latitude != null && r.longitude != null
              ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
              : null;
          return (
            <Card key={r.id} className="border-destructive/40">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{personName(r.caller)}</CardTitle>
                    <CardDescription>
                      {formatStatus(r.emergency_type)} ·{" "}
                      {new Date(r.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant="destructive">{formatStatus(r.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {r.caller?.phone ? (
                  <a
                    href={telHref(r.caller.phone)}
                    className="flex items-center gap-2 font-medium text-primary"
                  >
                    <Phone className="size-4" /> {r.caller.phone}
                  </a>
                ) : (
                  <p className="text-muted-foreground">No phone number in their profile.</p>
                )}

                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    {r.location_note && <p>{r.location_note}</p>}
                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        Open live location in Maps
                      </a>
                    ) : (
                      <p className="text-muted-foreground">No GPS location shared.</p>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground">
                  {[
                    r.caller?.student_id,
                    r.caller?.hostel,
                    r.caller?.blood_group && `Blood group ${r.caller.blood_group}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {r.contacts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Emergency contacts</p>
                    {r.contacts.map((c) => (
                      <a key={c.phone} href={telHref(c.phone)} className="block text-primary">
                        {c.name}
                        {c.relation ? ` (${c.relation})` : ""} · {c.phone}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  {next && (
                    <Button
                      size="sm"
                      disabled={advance.isPending}
                      onClick={() => advance.mutate({ id: r.id, status: next })}
                    >
                      Mark {formatStatus(next).toLowerCase()}
                    </Button>
                  )}
                  {r.status !== "completed" && next !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={advance.isPending}
                      onClick={() => advance.mutate({ id: r.id, status: "completed" })}
                    >
                      Close call
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mb-3 text-lg">Recent closed calls</h2>
      <div className="divide-y divide-border rounded-md border border-border">
        {!closed.length && <p className="p-3 text-sm text-muted-foreground">None yet.</p>}
        {closed.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span>
              {personName(r.caller)}
              {r.caller?.phone ? ` · ${r.caller.phone}` : ""}
            </span>
            <span className="text-muted-foreground">
              {formatStatus(r.status)} · {new Date(r.created_at).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
