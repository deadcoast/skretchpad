<script lang="ts">
  import Editor from './components/Editor.svelte';
  import Chrome from './components/Chrome.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import { onMount } from 'svelte';
  import { themeStore } from './lib/stores/theme';
  import { pluginsStore } from './lib/stores/plugins';
  import { keybindingStore } from './lib/stores/keybindings';

  let chromeVisible = true;
  let alwaysOnTop = false;
  let currentFile = '';

  onMount(async () => {
    try {
      // Initialize stores
      await initializeApp();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  });

  async function initializeApp() {
    // Theme and keybinding stores auto-initialize on import
    // Apply default theme to document
    if ($themeStore.current) {
      // Theme is already applied in store initialization
      console.log('Theme loaded:', $themeStore.current.metadata.name);
    }

    // Initialize plugin system (discover and load plugins)
    await pluginsStore.initialize();

    console.log('App initialized successfully');
  }

  function toggleChrome() {
    chromeVisible = !chromeVisible;
  }

  function toggleAlwaysOnTop() {
    alwaysOnTop = !alwaysOnTop;
    // TODO: Implement Tauri command
  }
</script>

<div class="app glass-window">
  {#if chromeVisible}
    <Chrome 
      {alwaysOnTop} 
      onToggleChrome={toggleChrome} 
      onTogglePin={toggleAlwaysOnTop}
    />
  {/if}
  
  <div class="editor-container">
    <Editor />
  </div>
  
  <StatusBar />
</div>

<style>
  .app {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  
  .glass-window {
    background: var(--window-bg);
    backdrop-filter: blur(var(--window-blur));
  }
  
  .editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    background: transparent;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  :global(html) {
    background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
  }
</style>
