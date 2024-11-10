import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { VitePWAOptions } from 'vite-plugin-pwa'
import { VitePWA as vitePWA } from 'vite-plugin-pwa'

const pwaOptions: Partial<VitePWAOptions> = {
  mode: 'production',
  includeAssets: ['favicon.ico'],
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  strategies: 'injectManifest',
  injectManifest: {
    globPatterns: ['**/*.{js,css,html,ico,png,json,svg}']
  },
  manifest: {
    name: 'Scorable',
    short_name: 'Scorable',
    description: 'A scoring app for Scrabble™',
    theme_color: '#FECC17',
    background_color: '#FECC17',
    display: 'standalone',
    icons: [
      {
        src: 'favicon.svg',
        sizes: '1024x1024',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: 'favicon-solid.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: 'favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  }
}

export default defineConfig({
  plugins: [react(), vitePWA(pwaOptions)],
  worker: { format: 'es' },

  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: '.vitest/setup',
    include: ['**/*.test.{ts,tsx}']
  }
})
