import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { APP_NAME } from "@/lib/campus";
import appLogo from "@/assets/thapar-logo.jpg";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in | Smart Dispensary" },
      {
        name: "description",
        content:
          "Sign in to access campus doctor consultations, dispensary appointments and emergency services.",
      },
      { property: "og:title", content: "Sign in | Smart Dispensary" },
      {
        property: "og:description",
        content: "Student access to the Thapar campus dispensary platform.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    // redirects to google, supabase brings the user back to /dashboard
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error(`Google sign-in failed: ${error.message}`);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, student_id: studentId },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created");
      navigate({ to: "/dashboard" });
      return;
    }
    setSignupSent(true);
    toast.success("Check your inbox to confirm your account");
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between border-r border-border bg-sidebar px-10 py-10 lg:flex">
        <Link to="/">
          <img src={appLogo} alt={APP_NAME} className="h-12 w-auto" />
        </Link>
        <div className="max-w-sm">
          <p className="font-display text-[1.75rem] leading-snug font-semibold">
            Your OPD token, prescriptions and the ambulance, on one account.
          </p>
          <ul className="mt-8 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <li>Register once with your roll number.</li>
            <li>The Health Centre sees your blood group and allergies only when you consult.</li>
            <li>Dispensary staff sign in separately.</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground">
          Emergency?{" "}
          <Link to="/emergency-help" className="text-foreground underline underline-offset-4">
            Campus emergency numbers
          </Link>
        </p>
      </aside>

      <main className="flex flex-col items-center justify-center px-5 py-10">
        <Link to="/" className="mb-8 lg:hidden">
          <img src={appLogo} alt={APP_NAME} className="h-12 w-auto" />
        </Link>
        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-[1.75rem]">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              New here? Use the Register tab — it takes a minute.
            </p>
          </div>
          <div>
            {signupSent ? (
              <div className="space-y-3 text-sm">
                <p className="font-medium">Confirm your email</p>
                <p className="text-muted-foreground">
                  We sent a confirmation link to <span className="font-medium">{email}</span>. Open
                  it to activate your Smart Dispensary account, then sign in.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSignupSent(false)}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={googleLoading}
                  onClick={handleGoogle}
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <GoogleIcon className="mr-2 size-4" />
                  )}
                  Continue with Google
                </Button>
                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or use email</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Tabs defaultValue="signin">
                  <TabsList className="w-full">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form className="space-y-4 pt-4" onSubmit={handleSignIn}>
                      <div className="space-y-2">
                        <Label htmlFor="si-email">Campus email</Label>
                        <Input
                          id="si-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="si-pass">Password</Label>
                        <Input
                          id="si-pass"
                          type="password"
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Sign in
                      </Button>
                      <p className="text-center text-xs text-muted-foreground">
                        <Link to="/forgot-password" className="text-primary underline">
                          Forgot password?
                        </Link>
                      </p>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form className="space-y-4 pt-4" onSubmit={handleSignUp}>
                      <div className="space-y-2">
                        <Label htmlFor="su-name">Full name</Label>
                        <Input
                          id="su-name"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="su-roll">Student ID / Roll number</Label>
                        <Input
                          id="su-roll"
                          required
                          placeholder="102103xxx"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="su-email">Email</Label>
                        <Input
                          id="su-email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="su-pass">Password</Label>
                        <Input
                          id="su-pass"
                          type="password"
                          required
                          minLength={4}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Create account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>

          <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
            Dispensary staff?{" "}
            <Link to="/staff-login" className="text-foreground underline underline-offset-4">
              Staff sign in
            </Link>
            <span className="lg:hidden">
              {" · "}
              <Link to="/emergency-help" className="text-foreground underline underline-offset-4">
                Emergency numbers
              </Link>
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.6 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.2-10.1 7.2-17.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.4 0-11.7-3.7-13.6-8.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
