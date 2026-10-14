import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slotLabel, isOpen, type DaySlot } from "@/hooks/use-day-slots";
import { SLOT_MINUTES, addMinutes, formatTime } from "@/lib/campus";

export function SlotSelect({
  slots,
  value,
  onChange,
  disabled,
  emptyText = "No slots left",
  className = "w-full sm:w-64",
}: {
  slots: DaySlot[];
  value: string;
  onChange: (slot: DaySlot) => void;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}) {
  const open = slots.filter(isOpen).length;
  return (
    <Select
      disabled={disabled || !open}
      value={value}
      onValueChange={(time) => {
        const s = slots.find((x) => x.time === time);
        if (s) onChange(s);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={open && !disabled ? "Select a time slot" : emptyText} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {slots.map((s) => (
          <SelectItem key={s.time} value={s.time} disabled={!isOpen(s)}>
            {formatTime(s.time)} – {formatTime(addMinutes(s.time, SLOT_MINUTES))}
            {slotLabel(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
