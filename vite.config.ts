import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  
  // Vite options tailored for Tauri
  clearScreen: false,
  
  server: {
    port: 5173,
    strictPort: true,
    // Tauri expects a fixed port, fail if occupied
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
  
  // To make use of `TAURI_DEBUG` and other env variables
  envPrefix: ['VITE_', 'TAURI_'],
  
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM === 'windows' 
      ? 'chrome105' 
      : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // Output directory
    outDir: 'dist',
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          'codemirror': [
            'codemirror',
            '@codemirror/state',
            '@codemirror/view',
          ],
          'codemirror-langs': [
            '@codemirror/lang-python',
            '@codemirror/lang-rust',
            '@codemirror/lang-javascript',
            '@codemirror/lang-markdown',
          ],
        },
      },
    },
  },
});