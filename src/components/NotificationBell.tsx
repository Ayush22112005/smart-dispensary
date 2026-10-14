import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/** Personal notifications, e.g. "your appointment was cancelled by the doctor". */
export function NotificationBell() {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unread = items?.filter((n) => !n.is_read).length ?? 0;

  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open && unread) markRead.mutate();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 shrink-0"
          title="Notifications"
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-2.5 text-sm font-medium">Notifications</p>
        <div className="max-h-96 overflow-y-auto">
          {!items?.length && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing new. Updates about your appointments show here.
            </p>
          )}
          {items?.map((n) => (
            <div
              key={n.id}
              className={cn(
                "border-b border-border px-4 py-3 text-sm last:border-b-0",
                !n.is_read && "bg-accent/40",
              )}
            >
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
