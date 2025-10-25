import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  
  compilerOptions: {
    // Enable run-time checks when not in production
    dev: process.env.NODE_ENV !== 'production',
  },
  
  vitePlugin: {
    // Emit CSS for SSR when needed
    emitCss: true,
    
    // Hot module replacement options
    hot: {
      preserveLocalState: true,
      noPreserveStateKey: '@!hmr',
      optimistic: false,
    },
  },
};