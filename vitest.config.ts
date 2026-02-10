import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      '$lib': resolve('./src/lib'),
      '@tauri-apps/api/core': resolve('./src/test/mocks/tauri-core.ts'),
      '@tauri-apps/api/event': resolve('./src/test/mocks/tauri-event.ts'),
      '@tauri-apps/api/path': resolve('./src/test/mocks/tauri-path.ts'),
      '@tauri-apps/plugin-dialog': resolve('./src/test/mocks/tauri-dialog.ts'),
      '@tauri-apps/plugin-fs': resolve('./src/test/mocks/tauri-fs.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/lib/**/*.svelte'],
      exclude: [
        'src/lib/icons/**',
        'src/test/**',
        'src/lib/editor-loader.ts',
        'src/lib/codemirror-loader.ts',
        'src/lib/plugin-api.ts',
        'src/lib/stores/editor.ts',
        'src/lib/stores/git.ts',
        'src/lib/stores/ui.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
});
