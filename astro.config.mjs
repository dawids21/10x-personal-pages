// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// eslint-disable-next-line no-undef
const isProduction = process.env.NODE_ENV === "production";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  // Use Node adapter for dev/test, Cloudflare for production
  adapter: isProduction ? cloudflare({ imageService: "compile" }) : node({ mode: "standalone" }),
  env: {
    schema: {
      SUPABASE_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
    },
  },
});
