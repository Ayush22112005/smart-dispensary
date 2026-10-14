import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BriefcaseMedical,
  ClipboardList,
  Loader2,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/lib/campus";
import { cn } from "@/lib/utils";
import appLogo from "@/assets/thapar-logo.jpg";

const STAFF_ROLES = {
  doctor: { label: "Doctor", icon: Stethoscope, to: "/doctor" },
  reception: { label: "Reception", icon: ClipboardList, to: "/reception" },
  ambulance: { label: "Ambulance", icon: Siren, to: "/ambulance-desk" },
  chemist: { label: "Chemist", icon: BriefcaseMedical, to: "/pharmacy" },
  admin: { label: "Admin", icon: ShieldCheck, to: "/admin" },
} as const;

type StaffRole = keyof typeof STAFF_ROLES;

export const Route = createFileRoute("/staff-login")({
  validateSearch: (search: Record<string, unknown>): { role?: StaffRole } => {
    const role = search["role"];
    return typeof role === "string" && role in STAFF_ROLES ? { role: role as StaffRole } : {};
  },
  head: () => ({
    meta: [
      { title: "Staff Sign In | Smart Dispensary" },
      {
        name: "description",
        content:
          "Sign in for Health Centre staff: doctors, reception, ambulance crew, chemist and admin.",
      },
    ],
  }),
  component: StaffLogin,
});

function StaffLogin() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [role, setRole] = useState<StaffRole>(search.role ?? "doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const chosen = STAFF_ROLES[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: rows, error: rErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (rErr) throw rErr;
      const roles = (rows ?? []).map((r) => r.role as string);

      // The admin console handles its own access (including claiming the first admin).
      if (role !== "admin" && !roles.includes(role) && !roles.includes("admin")) {
        await supabase.auth.signOut();
        throw new Error(
          `This account isn't set up as ${chosen.label.toLowerCase()}. Ask the admin to give it that role.`,
        );
      }

      toast.success(`Signed in as ${chosen.label.toLowerCase()}`);
      navigate({ to: chosen.to });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <img src={appLogo} alt={APP_NAME} className="h-16 w-auto" />
        </Link>

        <Card className="shadow-[var(--shadow-lift)]">
          <CardHeader>
            <CardTitle>Staff sign in</CardTitle>
            <CardDescription>
              Choose your role, then sign in with your staff account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-5" role="radiogroup">
              {(Object.keys(STAFF_ROLES) as StaffRole[]).map((key) => {
                const r = STAFF_ROLES[key];
                const active = key === role;
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRole(key)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                    )}
                  >
                    <r.icon className="size-5" />
                    {r.label}
                  </button>
                );
              })}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-pass">Password</Label>
                <Input
                  id="staff-pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                Sign in as {chosen.label.toLowerCase()}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/forgot-password" className="text-primary underline">
                Forgot password?
              </Link>
            </p>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Student?{" "}
              <Link to="/auth" className="text-primary underline">
                Student sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
