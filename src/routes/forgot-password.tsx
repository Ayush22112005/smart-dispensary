import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/lib/campus";
import appLogo from "@/assets/thapar-logo.jpg";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password | Smart Dispensary" },
      {
        name: "description",
        content:
          "Request a password reset link for your Thapar campus dispensary student or admin account.",
      },
      { property: "og:title", content: "Reset password | Smart Dispensary" },
      {
        property: "og:description",
        content: "Send yourself a secure reset link for the campus dispensary platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <img src={appLogo} alt={APP_NAME} className="h-16 w-auto" />
        </Link>

        <Card className="shadow-[var(--shadow-lift)]">
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
              Works for both student and admin accounts. We&apos;ll email you a secure link to set
              a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <MailCheck className="mt-0.5 size-5 text-primary" />
                  <p className="text-muted-foreground">
                    If an account exists for <span className="font-medium text-foreground">{email}</span>,
                    a reset link is on its way. Check your inbox and spam folder.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                  Send to a different email
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary underline">
                Student sign in
              </Link>
              {" · "}
              <Link to="/staff-login" className="text-primary underline">
                Staff sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
