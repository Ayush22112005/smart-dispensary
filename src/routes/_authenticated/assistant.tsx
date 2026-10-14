import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "AI Health Assistant | Smart Dispensary" },
      {
        name: "description",
        content:
          "Describe your symptoms and get campus dispensary medicine suggestions plus clear advice on when to see a doctor.",
      },
      { property: "og:title", content: "AI Health Assistant | Smart Dispensary" },
      {
        property: "og:description",
        content: "Symptom triage, OTC medicine guidance and doctor escalation for Thapar students.",
      },
    ],
  }),
  component: AssistantPage,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Fever and body ache since yesterday",
  "Sore throat and dry cough",
  "Acidity and stomach pain after meals",
  "Sprained ankle while playing",
];

const STORAGE_KEY = "sd-assistant-chat-v1";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! Tell me what you're feeling: symptoms, since when, and how bad. I'll suggest what's available at the campus dispensary and tell you clearly if you should see a doctor.\n\nI'm an assistant, not a doctor, so I can't diagnose.",
};

function loadStored(): ChatMessage[] {
  if (typeof window === "undefined") return [GREETING];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) && parsed.length ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
}

function AssistantPage() {
  const call = useServerFn(askAssistant);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      /* storage full or unavailable */
    }
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next: ChatMessage[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      const history = next.filter((m, i) => !(i === 0 && m.role === "assistant"));
      const res = await call({ data: { messages: history } });
      return res.reply;
    },
    onSuccess: (reply) => setMessages((m) => [...m, { role: "assistant", content: reply }]),
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || send.isPending) return;
    setInput("");
    send.mutate(t);
  };

  const resetChat = () => {
    setMessages([GREETING]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };


  return (
    <AppShell title="AI health assistant" description="Symptom guidance, medicine suggestions and doctor escalation">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="flex min-h-[30rem] flex-col">
          <CardHeader className="flex-row items-center gap-3">
            <div className="flex-1">
              <CardTitle className="text-base">Campus health assistant</CardTitle>
              <CardDescription>Remembers this conversation · not a medical diagnosis</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={resetChat} disabled={send.isPending}>
              <RotateCcw className="mr-1 size-4" /> New chat
            </Button>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-border bg-background p-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-sm ${
                    m.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {m.content}
                </div>
              ))}
              {send.isPending && (
                <div className="flex items-center gap-2 rounded-md bg-card px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Thinking…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => submit(s)} disabled={send.isPending}>
                  {s}
                </Button>
              ))}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
            >
              <Input
                value={input}
                placeholder="Describe your symptoms…"
                onChange={(e) => setInput(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={send.isPending}>
                <Send className="size-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader className="flex-row items-center gap-3">
            <ShieldAlert className="size-5 text-primary" />
            <CardTitle className="text-base">When to seek help immediately</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Use Emergency SOS or call campus ambulance 0175-2393333 if you have:</p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Chest pain or trouble breathing</li>
              <li>Fainting, seizure or confusion</li>
              <li>Heavy bleeding or a deep wound</li>
              <li>Severe allergic reaction or swelling</li>
              <li>Thoughts of harming yourself</li>
            </ul>
            <p>
              For anything lasting more than 48–72 hours, or fever above 102°F, book a doctor appointment instead of
              self-medicating.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
