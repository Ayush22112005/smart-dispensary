import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// sends the logged in user's token along with server function calls
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
