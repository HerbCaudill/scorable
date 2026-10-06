import { defineConfig } from "vite";
import { VitePWA as vitePWA, type VitePWAOptions } from "vite-plugin-pwa";

const pwaOptions: Partial<VitePWAOptions> = {
  mode: "production",
  includeAssets: ["favicon.ico"],
  srcDir: "src",
  filename: "sw.ts",
  registerType: "autoUpdate",
  strategies: "injectManifest",
  injectManifest: {
    globPatterns: ["**/*.{js,css,html,ico,png,json,svg}"],
  },
  manifest: {
    name: "Scorable",
    short_name: "Scorable",
    description: "A scoring app for Scrabble™",
    theme_color: "#FECC17",
    background_color: "#FECC17",
    display: "standalone",
    icons: [
      {
        src: "favicon.svg",
        sizes: "1024x1024",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "favicon-solid.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "favicon.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
};

/** Route the assigned loopback port and hot reload through the shared HTTPS proxy. */
const localhostServer = process.env.PORTLESS_URL
  ? {
      port: Number(process.env.PORT),
      host: "127.0.0.1",
      strictPort: true,
      allowedHosts: [new URL(process.env.PORTLESS_URL).hostname],
      hmr: {
        protocol: "wss" as const,
        host: new URL(process.env.PORTLESS_URL).hostname,
        clientPort: 443,
      },
    }
  : {};

export default defineConfig({
  ...(process.env.PORTLESS_URL
    ? { cacheDir: `node_modules/.cache/localhost-dev/${process.env.PORT}` }
    : {}),
  server: { ...localhostServer },
  plugins: [vitePWA(pwaOptions)],
  worker: { format: "es" },

  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ".vitest/setup",
    include: ["**/*.test.{ts,tsx}"],
  },
});
