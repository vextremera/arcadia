import { defineConfig, fontProviders } from "astro/config";
import db from "@astrojs/db";
import vercel from "@astrojs/vercel";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isVercelBuild =
  process.env.VERCEL === "1" || process.env.VERCEL === "true";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

if (isVercelBuild && !hasUpstash) {
  throw new Error(
    [
      "Arcadia requiere sesiones persistentes en producción.",
      "Faltan UPSTASH_REDIS_REST_URL y/o UPSTASH_REDIS_REST_TOKEN.",
      "Configura Upstash Redis antes de desplegar en Vercel para no romper auth, carrito y checkout.",
    ].join(" "),
  );
}

const sessionConfig = hasUpstash
  ? {
    driver: "upstash",
    options: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      base: "arcadia:session",
    },
    ttl: 60 * 60 * 24 * 30,
  }
  : {
    driver: "memory",
    ttl: 60 * 60 * 24 * 7,
  };

export default defineConfig({
  output: "server",
  adapter: vercel(),

  integrations: [db(), preact()],

  fonts: [
    {
      provider: fontProviders.google(),
      name: "Sigmar",
      cssVariable: "--font-sigmar",
      weights: [400],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
      display: "swap",
    },
  ],

  vite: {
    plugins: [
      tsconfigPaths({
        projects: [path.join(__dirname, "tsconfig.json")],
        loose: true,
        ignoreConfigErrors: true,
      }),
      tailwindcss(),
    ],
  },

  session: sessionConfig,
});