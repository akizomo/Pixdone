import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import manifest from './manifest.config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, '../../app/src'),
      // Dedupe React — imports via `@app/*` would otherwise resolve to
      // `app/node_modules/react`, producing two React copies in the bundle
      // and breaking hooks with "Cannot read properties of null".
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(
        __dirname,
        'node_modules/react/jsx-dev-runtime.js',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5180,
    strictPort: true,
    hmr: { port: 5181 },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
});
