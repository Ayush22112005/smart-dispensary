import { createFileRoute, redirect } from "@tanstack/react-router";

// Old admin sign-in URL; all staff now sign in from /staff-login.
export const Route = createFileRoute("/admin-login")({
  beforeLoad: () => {
    throw redirect({ to: "/staff-login", search: { role: "admin" } });
  },
});
