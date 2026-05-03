import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, '../../app/src'),
      // Dedupe React — `@app/*` imports traverse into app/node_modules/react,
      // but we need the extension's single React instance to run the tree.
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
    fs: {
      // Allow reading across the monorepo — app/ lives outside this package
      // but our path-alias imports reach into its node_modules (e.g. for
      // pixelarticons SVGs used inside DS components).
      allow: [path.resolve(__dirname, '../../')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
