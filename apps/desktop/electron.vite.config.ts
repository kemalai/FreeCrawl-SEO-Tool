import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Five entry points: the main process bootstrap and four
        // worker-thread bundles (DB reader, DB writer, HTML parser,
        // freeze-watchdog). All compile into `out/main/`; each Worker
        // constructor resolves its peer file relative to `__dirname`
        // so they pick up the same bundle directory.
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'db-reader-worker': resolve(__dirname, 'src/main/db-reader-worker.ts'),
          'db-writer-worker': resolve(__dirname, 'src/main/db-writer-worker.ts'),
          'parser-worker': resolve(__dirname, 'src/main/parser-worker.ts'),
          'freeze-watchdog-worker': resolve(
            __dirname,
            'src/main/freeze-watchdog-worker.ts',
          ),
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
