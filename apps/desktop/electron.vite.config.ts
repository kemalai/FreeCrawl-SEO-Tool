import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Two entry points: the main process bootstrap, and the
        // read-only DB worker that runs in a `worker_threads.Worker`.
        // Both compile into `out/main/`; the Worker constructor in
        // `db-reader-pool.ts` resolves the worker file relative to
        // `__dirname` so it picks up the same bundled module.
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'db-reader-worker': resolve(__dirname, 'src/main/db-reader-worker.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
      },
    },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') },
      },
    },
  },
});
