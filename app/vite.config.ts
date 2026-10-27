/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      // Native: the Google Fonts stylesheet blocks every script after it until it
      // loads, so a slow or offline network left the app blank (20s+ measured on
      // the Android emulator). Load it without blocking; fonts swap in when ready.
      name: 'native-nonblocking-fonts',
      transformIndexHtml(html) {
        if (mode !== 'native') return html;
        return html.replace(
          /<link href="(https:\/\/fonts\.googleapis\.com[^"]+)" rel="stylesheet">/,
          `<link href="$1" rel="stylesheet" media="print" onload="this.media='all'">`,
        );
      },
    },
    VitePWA({
      // Native (Capacitor) builds ship the bundle inside the app; a service worker
      // there would only serve stale assets after an app update.
      disable: mode === 'native',
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,gif,webp,mp3,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/.well-known\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 3 },
          },
        ],
      },
      manifest: false,
    }),
  ],
  server: {
    // Local dev: proxy `/api/*` requests to the Express backend.
    // This keeps `fetch('/api/...')` working from the Vite dev server.
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
          exclude: ['node_modules'],
          setupFiles: ['src/test/setup.ts'],
        },
      },
    ],
  }
}));