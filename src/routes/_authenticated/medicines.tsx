import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Minus, Phone, Plus, Search, Settings2, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProfile, useRoles } from "@/hooks/use-session";
import { telHref } from "@/lib/people";
import { DELIVERY_STAGES, formatStatus } from "@/lib/campus";
import { COMMON_MEDICINES } from "@/lib/common-medicines";

const PAYMENT_NOTE = "Payment: Pay on delivery";

export const Route = createFileRoute("/_authenticated/medicines")({
  head: () => ({
    meta: [
      { title: "Medicines | Smart Dispensary" },
      {
        name: "description",
        content:
          "Browse the campus dispensary catalogue, upload a prescription and get medicines delivered to your hostel.",
      },
      { property: "og:title", content: "Medicines | Smart Dispensary" },
      { property: "og:description", content: "Order dispensary medicines to your hostel." },
    ],
  }),
  component: MedicinesPage,
});

function MedicinesPage() {
  const { data: user } = useAuthUser();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: dbMedicines } = useQuery({
    queryKey: ["medicines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Dispensary stock from the database, topped up with the built-in common medicines list.
  const medicines = useMemo(() => {
    const db = (dbMedicines ?? []).map((m) => ({ ...m, key: m.id, dbId: m.id as string | null }));
    const names = new Set(db.map((m) => m.name.toLowerCase()));
    const common = COMMON_MEDICINES.filter((m) => !names.has(m.name.toLowerCase())).map((m) => ({
      ...m,
      key: `common:${m.name}`,
      dbId: null as string | null,
    }));
    return [...db, ...common].sort((a, b) => a.name.localeCompare(b.name));
  }, [dbMedicines]);

  const { data: roles } = useRoles();
  const canManage = roles?.some((r) => r === "chemist" || r === "admin");

  const { data: myRequests } = useQuery({
    queryKey: ["my-medicine-requests", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medicine_requests")
        .select("*, medicine_request_items(medicine_name, quantity)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const categories = useMemo(
    () =>
      ["All", ...new Set(medicines.map((m) => m.category))].sort((a, b) =>
        a === "All" ? -1 : b === "All" ? 1 : a.localeCompare(b),
      ),
    [medicines],
  );

  const filtered = useMemo(
    () =>
      medicines.filter(
        (m) =>
          (category === "All" || m.category === category) &&
          `${m.name} ${m.category} ${m.description ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [medicines, q, category],
  );

  const cartItems = medicines.filter((m) => cart[m.key]);
  const total = cartItems.reduce((sum, m) => sum + Number(m.price) * (cart[m.key] ?? 0), 0);
  const needsRx = cartItems.some((m) => m.requires_prescription);

  const submit = useMutation({
    mutationFn: async () => {
      if (!cartItems.length) throw new Error("Your cart is empty");
      if (!address.trim()) throw new Error("Add a delivery address");
      if (needsRx && !file)
        throw new Error("Upload a prescription for prescription-only medicines");

      let prescriptionPath: string | null = null;
      if (file) {
        const path = `${user!.id}/prescriptions/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("health-files").upload(path, file);
        if (upErr) throw upErr;
        prescriptionPath = path;
      }

      const { data: req, error } = await supabase
        .from("medicine_requests")
        .insert({
          student_id: user!.id,
          delivery_address: address,
          notes: [PAYMENT_NOTE, notes.trim()].filter(Boolean).join("\n"),
          prescription_path: prescriptionPath,
        })
        .select("id")
        .single();
      if (error) throw error;

      const items = cartItems.map((m) => ({
        request_id: req.id,
        medicine_id: m.dbId,
        medicine_name: m.name,
        quantity: cart[m.key]!,
      }));
      const { error: itemsErr } = await supabase.from("medicine_request_items").insert(items);
      if (itemsErr) throw itemsErr;
    },
    onSuccess: () => {
      toast.success("Order placed. Pay when your medicines are delivered.");
      setCart({});
      setNotes("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-medicine-requests"] });
      queryClient.invalidateQueries({ queryKey: ["chemist-contacts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // The chemist's number is only revealed once the student has placed a pay-on-delivery order.
  const hasOrdered = (myRequests?.length ?? 0) > 0;
  const { data: chemists } = useQuery({
    queryKey: ["chemist-contacts", user?.id],
    enabled: hasOrdered,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("chemist_contacts");
      if (error) throw error;
      return data ?? [];
    },
  });

  function setQty(id: string, delta: number) {
    setCart((c) => {
      const next = Math.max(0, (c[id] ?? 0) + delta);
      const copy = { ...c };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  return (
    <AppShell title="Medicines" description="Dispensary catalogue and hostel delivery">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commonly available medicines</CardTitle>
            <CardDescription>
              Stocked at the campus dispensary. Stock is updated by the dispensary team.
            </CardDescription>
            {canManage && (
              <Button asChild size="sm" variant="outline" className="mt-2 w-fit">
                <Link to="/pharmacy">
                  <Settings2 className="mr-1.5 size-4" /> Add or edit medicines
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search medicines"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={c === category ? "default" : "outline"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {filtered.map((m) => (
                <div
                  key={m.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    {m.description && (
                      <p className="text-xs text-muted-foreground">{m.description}</p>
                    )}
                    <p className="text-muted-foreground">
                      {m.category} · ₹{Number(m.price).toFixed(2)} ·{" "}
                      {m.stock > 0 ? `${m.stock} in stock` : "Out of stock"}
                    </p>
                    {m.requires_prescription && (
                      <Badge variant="outline" className="mt-1">
                        Prescription required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={!cart[m.key]}
                      onClick={() => setQty(m.key, -1)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-6 text-center">{cart[m.key] ?? 0}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8"
                      disabled={m.stock <= 0}
                      onClick={() => setQty(m.key, 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {!filtered.length && (
                <p className="text-sm text-muted-foreground">No medicines match your search.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your cart</CardTitle>
              <CardDescription>
                {cartItems.length} item(s) · ₹{total.toFixed(2)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!cartItems.length && (
                <p className="text-sm text-muted-foreground">Tap + on a medicine to add it.</p>
              )}
              {cartItems.map((m) => (
                <div key={m.key} className="flex justify-between text-sm">
                  <span>
                    {m.name} × {cart[m.key]}
                  </span>
                  <span className="text-muted-foreground">
                    ₹{(Number(m.price) * (cart[m.key] ?? 0)).toFixed(2)}
                  </span>
                </div>
              ))}
              {cartItems.length > 0 && (
                <div className="flex justify-between border-t border-border pt-2 text-sm font-medium">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="addr">Delivery address</Label>
                <Input
                  id="addr"
                  value={address}
                  placeholder={profile?.hostel ?? "Hostel and room number"}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes for the pharmacist</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rx" className="flex items-center gap-2">
                  <Upload className="size-4" /> Prescription {needsRx ? "(required)" : "(optional)"}
                </Label>
                <Input
                  id="rx"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment</Label>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-primary bg-accent/30 p-3 text-sm">
                  <input
                    type="radio"
                    name="payment"
                    checked
                    readOnly
                    className="accent-[var(--primary)]"
                  />
                  <Wallet className="size-4 text-primary" />
                  <span>
                    <span className="block font-medium">Pay on delivery</span>
                    <span className="block text-xs text-muted-foreground">
                      Pay ₹{total.toFixed(2)} in cash or UPI when your medicines arrive.
                    </span>
                  </span>
                </label>
              </div>
              <Button
                className="w-full"
                disabled={submit.isPending}
                onClick={() => submit.mutate()}
              >
                {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Place order · Pay on delivery
              </Button>
            </CardContent>
          </Card>

          {hasOrdered && (
            <Card className="border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Chemist contact</CardTitle>
                <CardDescription>For questions about your cash-on-delivery order.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {chemists?.length ? (
                  chemists.map((c) => (
                    <a
                      key={c.phone}
                      href={telHref(c.phone)}
                      className="flex items-center gap-2 font-medium text-primary"
                    >
                      <Phone className="size-4" /> {c.name || "Chemist"} · {c.phone}
                    </a>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    The chemist will call you on the phone number in your profile.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myRequests?.length ? (
                myRequests.map((r) => {
                  const idx = DELIVERY_STAGES.indexOf(r.status as never);
                  return (
                    <div key={r.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{formatStatus(r.status)}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {r.medicine_request_items
                          ?.map((i) => `${i.medicine_name} ×${i.quantity}`)
                          .join(", ")}
                      </p>
                      {r.notes?.includes(PAYMENT_NOTE) && (
                        <p className="mt-1 text-xs text-muted-foreground">Pay on delivery</p>
                      )}
                      <div className="mt-2 flex gap-1">
                        {DELIVERY_STAGES.map((stage, i) => (
                          <span
                            key={stage}
                            className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-border"}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
