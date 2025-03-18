import path from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import fs from 'fs';

// Ensure UI resources directory exists
const uiResourcesDir = path.join(__dirname, 'resources', 'ui', 'dist');
if (!fs.existsSync(uiResourcesDir)) {
  fs.mkdirSync(uiResourcesDir, { recursive: true });
}

// Path to workspace root
const workspaceRoot = path.join(__dirname, '..', '..');
const uiPackagePath = path.join(workspaceRoot, 'packages', 'ui');

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@comicers/ui': uiPackagePath,
      },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
    },
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@comicers/ui': uiPackagePath,
      },
    },
  },
  renderer: {
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: path.join(__dirname, 'src/renderer/index.html'),
        },
        external: ['@comicers/ui'],
      },
    },
    plugins: [
      nodePolyfills({
        include: ['path', 'fs', 'constants', 'stream', 'util', 'zlib'],
      }),
    ],
    resolve: {
      alias: {
        '@': path.join(__dirname, 'src'),
        '@ui': path.join(__dirname, 'resources', 'ui', 'dist'),
        '@comicers/ui': uiPackagePath,
      },
    },
  },
});
