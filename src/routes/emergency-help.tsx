import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Ambulance, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPUS_NAME } from "@/lib/campus";
import { useEmergencyNumbers } from "@/hooks/use-emergency-numbers";

export const Route = createFileRoute("/emergency-help")({
  head: () => ({
    meta: [
      { title: "Campus Emergency Numbers | Smart Dispensary" },
      {
        name: "description",
        content:
          "Thapar campus ambulance, dispensary and security emergency contact numbers, plus first-response guidance for students.",
      },
      { property: "og:title", content: "Campus Emergency Numbers | Smart Dispensary" },
      {
        property: "og:description",
        content: "Ambulance, dispensary and security numbers for Thapar campus emergencies.",
      },
    ],
  }),
  component: EmergencyHelp,
});

const steps = [
  "Make sure you and the patient are in a safe spot away from traffic.",
  "Call the campus ambulance number and state your hostel or building name.",
  "Do not move a person with a suspected head, neck or spine injury.",
  "Stay with the patient and keep their emergency profile details handy.",
];

function EmergencyHelp() {
  const { numbers: emergencyNumbers } = useEmergencyNumbers();
  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/">
            <ArrowLeft className="mr-1 size-4" /> Back
          </Link>
        </Button>

        <div className="mb-8 flex items-start gap-3">
          <span className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Ambulance className="size-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">Emergency help</h1>
            <p className="text-sm text-muted-foreground">{CAMPUS_NAME}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {emergencyNumbers.map((c) => (
            <a
              key={c.label}
              href={`tel:${c.number.replace(/\s/g, "")}`}
              className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-4 transition-colors hover:border-primary/60"
            >
              <span className="text-sm font-medium">{c.label}</span>
              <span className="flex items-center gap-2 text-sm text-primary">
                <Phone className="size-4" />
                {c.number}
              </span>
            </a>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">While help is on the way</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Health Centre doctors, staff and OPD timings are listed on the{" "}
          <Link to="/health-centre" className="text-primary underline">
            Health Centre page
          </Link>
          . Signed-in students can request an ambulance with location sharing from the{" "}
          <Link to="/auth" className="text-primary underline">
            app
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
