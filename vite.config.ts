import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import wasm from "vite-plugin-wasm"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 35 * 1024 * 1024, // 35 MB to accommodate Automerge WASM + word list
      },
      manifest: {
        name: "Scrabble Scorekeeper",
        short_name: "Scrabble",
        description: "Keep score during Scrabble games",
        theme_color: "#B0A092",
        background_color: "#B0A092",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
  build: {
    // The word list chunk is ~31MB (Scrabble dictionary with definitions).
    // This is intentional and cannot be reduced without losing functionality.
    chunkSizeWarningLimit: 32000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Scrabble dictionary - large word list with definitions (~31MB)
          "word-list": ["@herbcaudill/scrabble-words/csw21"],
          // Automerge - CRDT library for sync
          automerge: ["@automerge/automerge", "@automerge/automerge-repo"],
          // React core
          react: ["react", "react-dom"],
          // UI components
          radix: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-slot",
          ],
        },
      },
    },
  },
})
