import { defineConfig } from 'vitest/config';

// Unit tests target the Electron-free, pure modules (crawl-lease registry,
// the localhost bridge's HTTP routing). Anything that imports `electron` is
// out of scope here — those paths are exercised by the app itself.
export default defineConfig({
  plugins: [
    {
      // `node:sqlite` is a newer Node builtin that vite's SSR resolver
      // doesn't yet recognise: it strips the `node:` prefix, looks for a
      // package called `sqlite`, and fails to load it. Marking it external
      // isn't honoured by vitest's module runner here, so instead serve a
      // tiny virtual shim that re-exports the real builtin via createRequire
      // at run time (Node loads `node:sqlite` natively). Needed by the
      // ProjectDb-backed tests; app/build paths are unaffected.
      name: 'node-sqlite-shim',
      enforce: 'pre',
      resolveId(id) {
        if (id === 'node:sqlite' || id === 'sqlite') return '\0node-sqlite-shim';
        return null;
      },
      load(id) {
        if (id === '\0node-sqlite-shim') {
          return [
            "import { createRequire } from 'node:module';",
            'const req = createRequire(import.meta.url);',
            "const sqlite = req('node:sqlite');",
            'export const DatabaseSync = sqlite.DatabaseSync;',
            'export const StatementSync = sqlite.StatementSync;',
            'export default sqlite;',
          ].join('\n');
        }
        return null;
      },
    },
  ],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
