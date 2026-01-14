import { defineConfig } from "astro/config";
import db from "@astrojs/db";
import vercel from "@astrojs/vercel";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  output: "server",
  adapter: vercel(),

  integrations: [db(), preact()],

  vite: {
    plugins: [
      tsconfigPaths({
        projects: [path.join(__dirname, "tsconfig.json")],
        loose: true,
        ignoreConfigErrors: true
      }),
      tailwindcss(),
    ],
  },

  session: {
    driver: "memory",
  },
});
