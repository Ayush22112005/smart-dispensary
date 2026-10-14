import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Stethoscope,
  CalendarClock,
  Ambulance,
  Pill,
  Bot,
  Hospital,
  UserRound,
  ShieldCheck,
  ClipboardList,
  Siren,
  BriefcaseMedical,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRoles, type AppRole } from "@/hooks/use-session";
import { APP_NAME } from "@/lib/campus";
import { cn } from "@/lib/utils";
import appLogo from "@/assets/thapar-logo.jpg";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles?: AppRole[] };

const studentNav: { heading?: string; items: NavItem[] }[] = [
  { items: [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    heading: "Care",
    items: [
      { to: "/consult", label: "Talk to a doctor", icon: Stethoscope },
      { to: "/appointments", label: "Appointments", icon: CalendarClock },
      { to: "/medicines", label: "Medicines", icon: Pill },
      { to: "/assistant", label: "Health assistant", icon: Bot },
      { to: "/emergency", label: "Emergency", icon: Ambulance },
    ],
  },
  {
    heading: "You",
    items: [
      { to: "/profile", label: "Profile", icon: UserRound },
      { to: "/health-centre", label: "Health Centre", icon: Hospital },
    ],
  },
];

const staffNav: NavItem[] = [
  { to: "/doctor", label: "Doctor desk", icon: Stethoscope, roles: ["doctor"] },
  { to: "/reception", label: "Reception", icon: ClipboardList, roles: ["reception", "admin"] },
  { to: "/ambulance-desk", label: "Ambulance desk", icon: Siren, roles: ["ambulance", "admin"] },
  { to: "/pharmacy", label: "Pharmacy", icon: BriefcaseMedical, roles: ["chemist", "admin"] },
  { to: "/admin", label: "Admin console", icon: ShieldCheck, roles: ["admin"] },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: roles } = useRoles();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const initials =
    (profile?.full_name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "S";

  const visibleStaffNav = staffNav.filter((item) => item.roles?.some((r) => roles?.includes(r)));

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const NavLinks = () => (
    <nav className="space-y-5">
      {studentNav.map((group, i) => (
        <div key={group.heading ?? i} className="space-y-px">
          {group.heading && <p className="eyebrow px-3 pb-1.5">{group.heading}</p>}
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              active={pathname === item.to}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>
      ))}
      {visibleStaffNav.length > 0 && (
        <div className="space-y-px">
          <p className="eyebrow px-3 pb-1.5">Dispensary</p>
          {visibleStaffNav.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              active={pathname === item.to}
              onClick={() => setOpen(false)}
            />
          ))}
        </div>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <Link to="/dashboard" className="flex items-center border-b border-border px-5 py-4">
          <img src={appLogo} alt="Thapar Institute logo" className="h-11 w-auto object-contain" />
        </Link>
        <div className="flex-1 overflow-y-auto px-2 py-5">
          <NavLinks />
        </div>
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{profile?.full_name || "Student"}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={signOut}
            title="Sign out"
          >
            <LogOut />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-sidebar px-2 py-4">
            <div className="mb-5 flex items-center justify-between px-3">
              <span className="font-display text-lg font-semibold">{APP_NAME}</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <NavLinks />
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={signOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-5 py-4 md:px-8 md:py-5">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl md:text-2xl">{title}</h1>
              {description && (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            <NotificationBell />
            <Link
              to="/emergency"
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-xs font-semibold tracking-wide text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <Ambulance className="size-4" /> SOS
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      to={item.to as never}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-foreground before:absolute before:inset-y-1.5 before:-left-2 before:w-[3px] before:rounded-r before:bg-primary"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground",
      )}
    >
      <item.icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
      {item.label}
    </Link>
  );
}
