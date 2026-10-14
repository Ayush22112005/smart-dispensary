import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Stethoscope, Video } from "lucide-react";
import { VideoCallDialog, videoRoomUrl } from "@/components/VideoCallDialog";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/use-session";
import { formatStatus } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/consult")({
  head: () => ({
    meta: [
      { title: "Talk to a Doctor | Smart Dispensary" },
      {
        name: "description",
        content: "Start an online consultation with a campus doctor and chat about your symptoms securely.",
      },
      { property: "og:title", content: "Talk to a Doctor | Smart Dispensary" },
      { property: "og:description", content: "Online consultations with Thapar campus doctors." },
    ],
  }),
  component: ConsultPage,
});

function ConsultPage() {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();
  const [symptoms, setSymptoms] = useState("");
  const [mode, setMode] = useState("chat");
  const [doctorId, setDoctorId] = useState<string>("any");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: doctors } = useQuery({
    queryKey: ["doctors-online"],
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

  const { data: consultations } = useQuery({
    queryKey: ["my-consultations", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*, doctors(name, speciality)")
        .eq("student_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["consult-messages", activeId],
    enabled: !!activeId,
    refetchInterval: 8000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultation_messages")
        .select("*")
        .eq("consultation_id", activeId!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const start = useMutation({
    mutationFn: async () => {
      if (symptoms.trim().length < 10) throw new Error("Describe your symptoms in a bit more detail");
      const { data, error } = await supabase
        .from("consultations")
        .insert({
          student_id: user!.id,
          symptoms,
          mode,
          doctor_id: doctorId === "any" ? null : doctorId,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Consultation requested");
      setSymptoms("");
      setActiveId(id);
      queryClient.invalidateQueries({ queryKey: ["my-consultations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!message.trim() || !activeId) return;
      const { error } = await supabase.from("consultation_messages").insert({
        consultation_id: activeId,
        sender_id: user!.id,
        sender_role: "student",
        body: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["consult-messages", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeConsult = consultations?.find((c) => c.id === activeId);

  const startVideoCall = async () => {
    if (!activeId) return;
    setVideoOpen(true);
    await supabase.from("consultation_messages").insert({
      consultation_id: activeId,
      sender_id: user!.id,
      sender_role: "student",
      body: `Started a video call. Join here: ${videoRoomUrl(activeId)}`,
    });
    queryClient.invalidateQueries({ queryKey: ["consult-messages", activeId] });
  };

  return (
    <AppShell title="Talk to a doctor" description="Online consultations with campus doctors">
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New consultation</CardTitle>
              <CardDescription>A campus doctor replies during dispensary hours.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sym">Symptoms</Label>
                <Textarea
                  id="sym"
                  rows={4}
                  value={symptoms}
                  placeholder="Since when, what you feel, medicines already taken..."
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Doctor</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any available</SelectItem>
                      {doctors?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name} · {d.speciality}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" disabled={start.isPending} onClick={() => start.mutate()}>
                {start.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Stethoscope className="mr-2 size-4" /> Start consultation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">My consultations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {consultations?.length ? (
                consultations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      activeId === c.id ? "border-primary bg-accent/40" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.doctors?.name ?? "Awaiting doctor"}</span>
                      <Badge variant="secondary">{formatStatus(c.status)}</Badge>
                    </div>
                    <p className="line-clamp-1 text-muted-foreground">{c.symptoms}</p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No consultations yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="flex min-h-[28rem] flex-col">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-base">
                {activeConsult ? activeConsult.doctors?.name ?? "Consultation" : "Conversation"}
              </CardTitle>
              <CardDescription>
                {activeConsult ? activeConsult.symptoms : "Select a consultation to see messages."}
              </CardDescription>
            </div>
            <Button size="sm" disabled={!activeId} onClick={startVideoCall}>
              <Video className="mr-2 size-4" /> Video call
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md bg-accent/25 p-3">
              {messages?.length ? (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                      m.sender_role === "student"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-card"
                    }`}
                  >
                    <p>{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">
                      {new Date(m.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {activeId ? "No messages yet." : "No conversation selected."}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send.mutate();
              }}
            >
              <Input
                value={message}
                disabled={!activeId}
                placeholder="Type a message"
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={!activeId || send.isPending}>
                <Send className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {activeId && (
        <VideoCallDialog
          open={videoOpen}
          onOpenChange={setVideoOpen}
          consultationId={activeId}
          doctorName={activeConsult?.doctors?.name ?? undefined}
          displayName={user?.email ?? undefined}
        />
      )}
    </AppShell>
  );
}
