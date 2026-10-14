import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_BOOKING_HOURS,
  SLOT_MINUTES,
  addMinutes,
  buildSlotTimes,
  localDateKey,
  shortTime,
} from "@/lib/campus";

export type DaySlot = {
  time: string;
  token: number;
  taken: boolean;
  past: boolean;
  blocked: boolean;
};

/**
 * Everything needed to show bookable 20-minute slots for one date: active doctors,
 * admin availability windows, doctor leave / blocked time and slots already taken.
 */
export function useDaySlots(date: string) {
  const doctorsQuery = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Availability added by admins for this date; replaces the default hours for that doctor.
  const { data: windows } = useQuery({
    queryKey: ["slots", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_slots")
        .select("doctor_id, start_time, end_time")
        .eq("slot_date", date);
      if (error) throw error;
      return data;
    },
  });

  const { data: unavailable } = useQuery({
    queryKey: ["doctor-unavailability", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_unavailability")
        .select("*")
        .lte("start_date", date)
        .gte("end_date", date);
      if (error) throw error;
      return data;
    },
  });

  // Every taken slot on this date (any patient), so taken times show as booked.
  const bookedQuery = useQuery({
    queryKey: ["booked-slots", date],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("booked_slot_times", { _date: date });
      if (error) throw error;
      return data;
    },
  });

  const bookedSet = useMemo(
    () => new Set((bookedQuery.data ?? []).map((b) => `${b.doctor_id}|${shortTime(b.start_time)}`)),
    [bookedQuery.data],
  );

  const nowTime = date === localDateKey(new Date()) ? shortTime(new Date().toTimeString()) : null;

  /** Whole-day leave for this doctor on this date, if any. */
  function leaveFor(doctorId: string) {
    return (unavailable ?? []).find((u) => u.doctor_id === doctorId && !u.start_time);
  }

  function slotsFor(doctorId: string): DaySlot[] {
    const own = (windows ?? []).filter((w) => w.doctor_id === doctorId);
    const hours = own.length
      ? own.map((w) => ({ start: shortTime(w.start_time), end: shortTime(w.end_time) }))
      : DEFAULT_BOOKING_HOURS;
    const blocks = (unavailable ?? []).filter((u) => u.doctor_id === doctorId);
    return buildSlotTimes(hours).map((time, i) => {
      const end = addMinutes(time, SLOT_MINUTES);
      const blocked = blocks.some(
        (b) =>
          !b.start_time ||
          !b.end_time ||
          (time < shortTime(b.end_time) && end > shortTime(b.start_time)),
      );
      return {
        time,
        token: i + 1,
        taken: bookedSet.has(`${doctorId}|${time}`),
        past: nowTime !== null && time <= nowTime,
        blocked,
      };
    });
  }

  return {
    doctors: doctorsQuery.data,
    isLoading: doctorsQuery.isLoading || bookedQuery.isLoading,
    slotsFor,
    leaveFor,
  };
}

export function slotLabel(s: DaySlot) {
  if (s.taken) return " · Booked";
  if (s.blocked) return " · Unavailable";
  if (s.past) return " · Passed";
  return "";
}

export const isOpen = (s: DaySlot) => !s.taken && !s.past && !s.blocked;

/** The next `days` dates starting today, as YYYY-MM-DD. */
export function upcomingDates(days: number) {
  const now = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return localDateKey(d);
  });
}

/** Turns a Supabase booking error into something the person booking can act on. */
export function bookingErrorMessage(error: { code?: string; message: string }) {
  // 23505 = unique violation: someone else took this slot first.
  if (error.code === "23505")
    return "Sorry, this slot was just booked by someone else. Please pick another.";
  // P0001 = raised by the check_doctor_available trigger (leave / blocked time).
  if (error.code === "P0001") return "The doctor is not available at this time. Pick another slot.";
  return error.message;
}
