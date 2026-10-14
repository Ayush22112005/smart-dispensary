import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { MedicinesManager } from "@/components/MedicinesManager";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { COMMON_MEDICINES } from "@/lib/common-medicines";
import { fetchPeople, personName, telHref } from "@/lib/people";
import { DELIVERY_STAGES, formatStatus } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/pharmacy")({
  head: () => ({ meta: [{ title: "Pharmacy | Smart Dispensary" }] }),
  component: () => (
    <RequireRole roles={["chemist", "admin"]} title="Pharmacy">
      <AppShell title="Pharmacy" description="Medicine orders and dispensary stock">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="medicines">Medicines</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="pt-4">
            <Orders />
          </TabsContent>
          <TabsContent value="medicines" className="pt-4">
            <MedicinesManager />
          </TabsContent>
        </Tabs>
      </AppShell>
    </RequireRole>
  ),
});

function Orders() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["pharmacy-orders"],
    refetchInterval: 20000,
    queryFn: async () => {
      const [{ data: rows, error }, { data: meds, error: mErr }] = await Promise.all([
        supabase
          .from("medicine_requests")
          .select("*, medicine_request_items(medicine_id, medicine_name, quantity)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("medicines").select("id, name, price"),
      ]);
      if (error) throw error;
      if (mErr) throw mErr;
      const people = await fetchPeople((rows ?? []).map((r) => r.student_id));
      const priceOf = (id: string | null, name: string) =>
        Number(
          meds?.find((m) => m.id === id || m.name === name)?.price ??
            COMMON_MEDICINES.find((m) => m.name === name)?.price ??
            0,
        );
      return (rows ?? []).map((r) => ({
        ...r,
        customer: people.get(r.student_id),
        total: (r.medicine_request_items ?? []).reduce(
          (sum, i) => sum + priceOf(i.medicine_id, i.medicine_name) * i.quantity,
          0,
        ),
      }));
    },
  });

  const setStatus = useMutation({
    mutationFn: async (vars: { id: string; status: string }) => {
      const { error } = await supabase
        .from("medicine_requests")
        .update({ status: vars.status })
        .eq("id", vars.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openPrescription(path: string) {
    const { data: signed, error } = await supabase.storage
      .from("health-files")
      .createSignedUrl(path, 300);
    if (error) {
      toast.error(error.message);
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener");
  }

  const open = data?.filter((r) => !["delivered", "cancelled"].includes(r.status)) ?? [];
  const done = data?.filter((r) => ["delivered", "cancelled"].includes(r.status)) ?? [];

  const OrderCard = ({ r }: { r: NonNullable<typeof data>[number] }) => {
    const idx = DELIVERY_STAGES.indexOf(r.status as never);
    const next = DELIVERY_STAGES[idx + 1];
    const closed = ["delivered", "cancelled"].includes(r.status);
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{personName(r.customer)}</CardTitle>
              <CardDescription>
                {new Date(r.created_at).toLocaleString("en-IN")} · Pay on delivery ₹
                {r.total.toFixed(2)}
              </CardDescription>
            </div>
            <Badge variant={r.status === "cancelled" ? "destructive" : "secondary"}>
              {formatStatus(r.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-inside list-disc">
            {r.medicine_request_items?.map((i) => (
              <li key={i.medicine_name}>
                {i.medicine_name} × {i.quantity}
              </li>
            ))}
          </ul>
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {r.delivery_address}
          </p>
          {r.customer?.phone && (
            <a href={telHref(r.customer.phone)} className="flex items-center gap-2 text-primary">
              <Phone className="size-4" /> {r.customer.phone}
            </a>
          )}
          {r.notes && <p className="whitespace-pre-line text-muted-foreground">{r.notes}</p>}
          {r.prescription_path && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openPrescription(r.prescription_path!)}
            >
              <FileText className="mr-1 size-4" /> View prescription
            </Button>
          )}
          {!closed && (
            <div className="flex flex-wrap gap-2 pt-1">
              {next && (
                <Button
                  size="sm"
                  disabled={setStatus.isPending}
                  onClick={() => setStatus.mutate({ id: r.id, status: next })}
                >
                  {next === "delivered"
                    ? "Delivered & paid"
                    : `Mark ${formatStatus(next).toLowerCase()}`}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ id: r.id, status: "cancelled" })}
              >
                Cancel order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      <section>
        <h2 className="mb-3 text-lg">To deliver ({open.length})</h2>
        {!isLoading && !open.length && (
          <p className="text-sm text-muted-foreground">No pending orders.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {open.map((r) => (
            <OrderCard key={r.id} r={r} />
          ))}
        </div>
      </section>
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg">Completed</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {done.map((r) => (
              <OrderCard key={r.id} r={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
