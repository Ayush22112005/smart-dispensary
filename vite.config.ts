import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // make non-VITE_ vars (like GEMINI_API_KEY) visible to server functions.
  // read .env from this folder, not the cwd, so it works however the server is started.
  const root = fileURLToPath(new URL(".", import.meta.url));
  Object.assign(process.env, loadEnv(mode, root, ""));

  return {
    server: { port: 3000 },
    resolve: { tsconfigPaths: true },
    plugins: [tailwindcss(), tanstackStart(), viteReact()],
  };
});
