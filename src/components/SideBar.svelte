<!-- src/lib/components/Sidebar.svelte -->

<script lang="ts">
    import { pluginsStore, visiblePanels } from '$lib/stores/plugins';
    import { onMount } from 'svelte';
    import { icons } from '../lib/icons/index';
  
    export let visible = true;
  
    // Get visible plugin panels
    $: pluginPanels = $visiblePanels.filter(panel => panel.position === 'sidebar');
  
    // Active panel
    let activePanel: string | null = null;
  
    onMount(() => {
      // Set first panel as active if available
      if (pluginPanels.length > 0) {
        activePanel = pluginPanels[0].id;
      }
    });
  
    function setActivePanel(panelId: string) {
      activePanel = panelId;
    }
  
    function closePanel(panelId: string) {
      pluginsStore.hidePanel(panelId);
      
      // If closing active panel, switch to another
      if (activePanel === panelId && pluginPanels.length > 1) {
        const index = pluginPanels.findIndex(p => p.id === panelId);
        const nextPanel = pluginPanels[index + 1] || pluginPanels[index - 1];
        activePanel = nextPanel?.id || null;
      }
    }
  </script>
  
  <aside class="sidebar" class:sidebar--visible={visible}>
    <!-- Sidebar tabs -->
    {#if pluginPanels.length > 0}
      <div class="sidebar__tabs">
        {#each pluginPanels as panel (panel.id)}
          <button
            class="sidebar__tab"
            class:sidebar__tab--active={activePanel === panel.id}
            title={panel.title}
            on:click={() => setActivePanel(panel.id)}
          >
            {panel.title}
          </button>
        {/each}
      </div>
    {/if}
  
    <!-- Sidebar content -->
    <div class="sidebar__content">
      {#each pluginPanels as panel (panel.id)}
        {#if activePanel === panel.id}
          <div class="sidebar__panel">
            <div class="sidebar__panel-header">
              <h3 class="sidebar__panel-title">{panel.title}</h3>
              <button
                class="sidebar__panel-close"
                on:click={() => closePanel(panel.id)}
                aria-label="Close panel"
              >
                {@html icons.close}
              </button>
            </div>
  
            <div class="sidebar__panel-content">
              <!-- Panel content would be rendered here -->
              <!-- This would typically be a webview or iframe for plugin content -->
              <div class="sidebar__panel-placeholder">
                <p>Panel: {panel.id}</p>
                <p>Plugin: {panel.plugin_id}</p>
              </div>
            </div>
          </div>
        {/if}
      {/each}
  
      <!-- Default content when no panels -->
      {#if pluginPanels.length === 0}
        <div class="sidebar__empty">
          <p>No active plugin panels</p>
        </div>
      {/if}
    </div>
  </aside>
  
  <style>
    .sidebar {
      display: flex;
      flex-direction: column;
      width: 300px;
      background: var(--chrome-bg);
      border-right: 1px solid var(--window-border-color);
      transform: translateX(-100%);
      transition: transform var(--transition-chrome, 200ms);
    }
  
    .sidebar--visible {
      transform: translateX(0);
    }
  
    .sidebar__tabs {
      display: flex;
      border-bottom: 1px solid var(--window-border-color);
      overflow-x: auto;
      flex-shrink: 0;
    }
  
    .sidebar__tab {
      padding: 8px 16px;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: inherit;
      font-size: 12px;
      cursor: pointer;
      white-space: nowrap;
      transition: all var(--transition-hover, 100ms);
    }
  
    .sidebar__tab:hover {
      background: var(--button-hover);
    }
  
    .sidebar__tab--active {
      border-bottom-color: var(--color-info, #00d9ff);
      font-weight: 600;
    }
  
    .sidebar__content {
      flex: 1;
      overflow: hidden;
    }
  
    .sidebar__panel {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
  
    .sidebar__panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--window-border-color);
      flex-shrink: 0;
    }
  
    .sidebar__panel-title {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  
    .sidebar__panel-close {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background var(--transition-hover, 100ms);
    }

    .sidebar__panel-close :global(svg) {
      width: 14px;
      height: 14px;
    }
  
    .sidebar__panel-close:hover {
      background: var(--button-hover);
    }
  
    .sidebar__panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
  
    .sidebar__panel-placeholder {
      color: var(--editor-fg);
      opacity: 0.6;
      text-align: center;
      padding: 32px 16px;
    }
  
    .sidebar__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--editor-fg);
      opacity: 0.4;
      text-align: center;
      padding: 32px;
    }
  </style>