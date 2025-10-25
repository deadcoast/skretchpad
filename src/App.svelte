<script lang="ts">
  import Editor from './components/Editor.svelte';
  import Chrome from './components/Chrome.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import { onMount } from 'svelte';
  
  let chromeVisible = true;
  let alwaysOnTop = false;
  let currentFile = '';
  
  onMount(() => {
    // Apply default glass theme
    applyGlassTheme();
  });
  
  function toggleChrome() {
    chromeVisible = !chromeVisible;
  }
  
  function toggleAlwaysOnTop() {
    alwaysOnTop = !alwaysOnTop;
    // TODO: Implement Tauri command
  }
  
  function applyGlassTheme() {
    // Apply liquid glass theme CSS variables
    document.documentElement.style.setProperty('--window-bg', 'rgba(18, 18, 18, 0.85)');
    document.documentElement.style.setProperty('--window-blur', '20px');
    document.documentElement.style.setProperty('--editor-bg', 'transparent');
    document.documentElement.style.setProperty('--editor-fg', '#e4e4e4');
    document.documentElement.style.setProperty('--cursor-color', '#00d9ff');
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
  
  <StatusBar {currentFile} />
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
