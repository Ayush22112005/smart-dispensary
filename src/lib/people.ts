import { supabase } from "@/integrations/supabase/client";

export type PersonSummary = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  student_id: string | null;
  hostel: string | null;
  blood_group: string | null;
};

/**
 * Profiles keyed by user id. Most tables point at auth.users rather than profiles,
 * so desks look up names and phone numbers with a second query.
 */
export async function fetchPeople(ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return new Map<string, PersonSummary>();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, student_id, hostel, blood_group")
    .in("id", unique);
  if (error) throw error;
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export const personName = (p?: PersonSummary) => p?.full_name || p?.email || "Unknown patient";

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
