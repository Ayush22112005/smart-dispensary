import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Loader2, Plus, Save, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { COMMON_MEDICINES } from "@/lib/common-medicines";

type MedicineRecord = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  stock: number;
  requires_prescription: boolean;
};

const EMPTY = { name: "", category: "General", description: "", price: "0", stock: "0" };

/** Add / edit / remove dispensary medicines. Used by the chemist desk and the admin console. */
export function MedicinesManager() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [q, setQ] = useState("");

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["admin-medicines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("medicines").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const missingCommon = useMemo(() => {
    const names = new Set((medicines ?? []).map((m) => m.name.toLowerCase()));
    return COMMON_MEDICINES.filter((m) => !names.has(m.name.toLowerCase()));
  }, [medicines]);

  const filtered = (medicines ?? []).filter((m) =>
    `${m.name} ${m.category}`.toLowerCase().includes(q.toLowerCase()),
  );

  function useMedMutation<T>(fn: (vars: T) => Promise<void>, message: string) {
    return useMutation({
      mutationFn: fn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-medicines"] });
        queryClient.invalidateQueries({ queryKey: ["medicines"] });
        toast.success(message);
      },
      onError: (e: Error) => toast.error(e.message),
    });
  }

  const create = useMedMutation(async () => {
    const { error } = await supabase.from("medicines").insert({
      name: form.name.trim(),
      category: form.category.trim() || "General",
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    });
    if (error) throw error;
    setForm(EMPTY);
  }, "Medicine added");

  const importCommon = useMedMutation(async () => {
    const { error } = await supabase.from("medicines").insert(missingCommon);
    if (error) throw error;
  }, "Common medicines added. Edit prices and stock below.");

  const update = useMedMutation(
    async ({ id, patch }: { id: string; patch: Partial<MedicineRecord> }) => {
      const { error } = await supabase.from("medicines").update(patch).eq("id", id);
      if (error) throw error;
    },
    "Medicine updated",
  );

  const remove = useMedMutation(async (id: string) => {
    const { error } = await supabase.from("medicines").delete().eq("id", id);
    if (error) throw error;
  }, "Medicine removed");

  return (
    <div className="space-y-4">
      {missingCommon.length > 0 && (
        <Card className="border-primary/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <div>
              <p className="text-sm font-medium">
                {missingCommon.length} common medicines aren't in stock records yet
              </p>
              <p className="text-xs text-muted-foreground">
                Students already see them. Add them here so you can set real prices and stock.
              </p>
            </div>
            <Button
              disabled={importCommon.isPending}
              onClick={() => importCommon.mutate(undefined)}
            >
              {importCommon.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Add common medicines
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a medicine</CardTitle>
          <CardDescription>It shows in the student catalogue straight away.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Paracetamol 500 mg"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Stock</Label>
            <Input
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!form.name.trim() || create.isPending}
              onClick={() => create.mutate(undefined)}
            >
              <Plus className="mr-1 size-4" /> Add
            </Button>
          </div>
          <div className="space-y-1.5 sm:col-span-6">
            <Label>Use / pack size (optional)</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Fever, headache · strip of 10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={`Search ${medicines?.length ?? 0} medicines`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      <div className="space-y-3">
        {filtered.map((med) => (
          <MedicineRow
            key={med.id}
            medicine={med}
            onSave={(patch) => update.mutate({ id: med.id, patch })}
            onDelete={() => remove.mutate(med.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MedicineRow({
  medicine,
  onSave,
  onDelete,
}: {
  medicine: MedicineRecord;
  onSave: (patch: Partial<MedicineRecord>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(medicine.name);
  const [category, setCategory] = useState(medicine.category);
  const [description, setDescription] = useState(medicine.description ?? "");
  const [price, setPrice] = useState(String(medicine.price));
  const [stock, setStock] = useState(String(medicine.stock));

  return (
    <Card>
      <CardContent className="grid gap-3 pt-6 sm:grid-cols-6">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Price (₹)</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Stock</Label>
          <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            size="sm"
            onClick={() =>
              onSave({
                name,
                category,
                description: description.trim() || null,
                price: Number(price) || 0,
                stock: Number(stock) || 0,
              })
            }
          >
            <Save className="mr-1 size-4" /> Save
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        <div className="space-y-1.5 sm:col-span-4">
          <Input
            value={description}
            placeholder="Use / pack size"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <Switch
            checked={medicine.requires_prescription}
            onCheckedChange={(v) => onSave({ requires_prescription: v })}
          />
          Prescription required
        </label>
      </CardContent>
    </Card>
  );
}
