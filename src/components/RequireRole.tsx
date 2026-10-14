import type { ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoles, type AppRole } from "@/hooks/use-session";

/** Renders the page only for people holding one of `roles`; everyone else gets a notice. */
export function RequireRole({
  roles,
  title,
  children,
}: {
  roles: AppRole[];
  title: string;
  children: ReactNode;
}) {
  const { data: mine, isLoading } = useRoles();

  if (isLoading) {
    return (
      <AppShell title={title}>
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </AppShell>
    );
  }

  if (!roles.some((r) => mine?.includes(r))) {
    return (
      <AppShell title={title} description="Restricted area">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5 text-primary" /> Access required
            </CardTitle>
            <CardDescription>
              This page is for {roles.filter((r) => r !== "admin").join(" / ")} staff. Ask the admin
              to give your account that role from Admin console → People &amp; roles.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  return <>{children}</>;
}
