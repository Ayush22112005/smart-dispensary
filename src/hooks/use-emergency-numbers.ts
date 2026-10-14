import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EMERGENCY_CONTACTS } from "@/lib/campus";

export type EmergencyNumber = { label: string; number: string };

export function useEmergencyNumbers() {
  const query = useQuery({
    queryKey: ["emergency-numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_numbers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const numbers: EmergencyNumber[] = query.data?.length
    ? query.data.map((row) => ({ label: row.label, number: row.phone }))
    : EMERGENCY_CONTACTS;

  return { numbers, ...query };
}
