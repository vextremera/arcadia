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

const sessionDriver = hasUpstash
  ? {
    entrypoint: "unstorage/drivers/upstash",
    config: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      base: "arcadia:session",
    },
  }
  : {
    entrypoint: "unstorage/drivers/memory",
    config: {},
  };

const sessionConfig = {
  driver: sessionDriver,
  ttl: hasUpstash ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
};

export default defineConfig({
  output: "server",
  adapter: vercel(),

  /**
   * `security.csp` de Astro está desactivado a propósito.
   *
   * Astro construye la política calculando el hash de cada script, pero sólo de
   * los que él procesa: los diez `<script is:inline>` del proyecto (menú móvil,
   * barra lateral del panel, pantallas de menú diario y festivo…) quedan fuera
   * y el navegador los bloquea. Se probó contra el build y tumbaba el menú
   * hamburguesa y buena parte del panel. Además dos de ellos usan `define:vars`,
   * que obliga a `is:inline` y no admite otra forma.
   *
   * La política se envía desde src/server/security/headers.ts, sin hashes.
   */

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