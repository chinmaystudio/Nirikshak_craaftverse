import { defineConfig, normalizePath } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const configDir = path.dirname(fileURLToPath(import.meta.url));

function moduleAliasPlugin() {
  return {
    name: 'module-scoped-alias',
    enforce: 'pre' as const,
    resolveId(source: string, importer: string | undefined) {
      if (!source.startsWith('@/') || !importer) {
        return null;
      }
      const norm = normalizePath(importer);
      const subpath = source.slice(2);

      let targetDir = path.resolve(configDir, 'src');
      if (norm.includes('/src/modules/government/')) {
        targetDir = path.resolve(configDir, 'src/modules/government');
      } else if (norm.includes('/src/modules/user/')) {
        targetDir = path.resolve(configDir, 'src/modules/user');
      } else if (norm.includes('/src/modules/contractor/')) {
        targetDir = path.resolve(configDir, 'src/modules/contractor');
      }

      const base = path.join(targetDir, subpath);
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        path.join(base, 'index.ts'),
        path.join(base, 'index.tsx'),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          return normalizePath(cand);
        }
      }

      // If not in sub-module, try src/<subpath>
      const srcBase = path.join(path.resolve(configDir, 'src'), subpath);
      const srcCandidates = [
        srcBase,
        `${srcBase}.ts`,
        `${srcBase}.tsx`,
        `${srcBase}.js`,
        `${srcBase}.jsx`,
        path.join(srcBase, 'index.ts'),
        path.join(srcBase, 'index.tsx'),
      ];
      for (const cand of srcCandidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          return normalizePath(cand);
        }
      }

      return null;
    },
  };
}

export default defineConfig({
  plugins: [moduleAliasPlugin(), react()],
  build: {
    // Browser applications must ship JavaScript, but production source files,
    // source maps, and readable module names should never be published.
    sourcemap: false,
    minify: 'oxc',
    manifest: false,
  },
  server: {
    port: 5173,
    host: true,
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
});
