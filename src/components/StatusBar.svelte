<!-- src/lib/components/StatusBar.svelte -->

<script lang="ts">
  import { pluginsStore, sortedStatusBarItems } from '$lib/stores/plugins';
  import { editorStore, activeFile } from '$lib/stores/editor';

  // Local component state
  let showPluginMenu = false;

  // Get cursor position
  $: cursorPosition = $editorStore.cursorPosition;

  // Get file info
  $: fileInfo = $activeFile;

  // Get plugin status bar items
  $: pluginItems = $sortedStatusBarItems;

  function togglePluginMenu() {
    showPluginMenu = !showPluginMenu;
  }

  function handlePluginMenuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      showPluginMenu = false;
    }
  }

  function handleStatusBarItemClick(item: any) {
    if (item.onClick) {
      item.onClick();
    }
  }
</script>

<div class="status-bar">
  <!-- Left section -->
  <div class="status-bar__left">
    <!-- File info -->
    {#if fileInfo}
      <div class="status-item">
        <span class="status-item__icon">📄</span>
        <span class="status-item__text">{fileInfo.name}</span>
        {#if fileInfo.isDirty}
          <span class="status-item__indicator">●</span>
        {/if}
      </div>

      <div class="status-item">
        <span class="status-item__text">{fileInfo.language || 'Plain Text'}</span>
      </div>
    {/if}

    <!-- Plugin status bar items (left-aligned) -->
    {#each pluginItems.filter(item => item.priority >= 100) as item (item.id)}
      <button
        class="status-item status-item--clickable"
        style:color={item.color}
        title={item.tooltip}
        on:click={() => handleStatusBarItemClick(item)}
      >
        <span class="status-item__text">{item.text}</span>
      </button>
    {/each}
  </div>

  <!-- Right section -->
  <div class="status-bar__right">
    <!-- Plugin status bar items (right-aligned) -->
    {#each pluginItems.filter(item => item.priority < 100) as item (item.id)}
      <button
        class="status-item status-item--clickable"
        style:color={item.color}
        title={item.tooltip}
        on:click={() => handleStatusBarItemClick(item)}
      >
        <span class="status-item__text">{item.text}</span>
      </button>
    {/each}

    <!-- Cursor position -->
    {#if cursorPosition}
      <div class="status-item">
        <span class="status-item__text">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
      </div>
    {/if}

    <!-- Selection info -->
    {#if $editorStore.selection}
      <div class="status-item">
        <span class="status-item__text">
          ({$editorStore.selection.length} selected)
        </span>
      </div>
    {/if}

    <!-- Plugin indicator -->
    <button
      class="status-item status-item--clickable"
      title="Plugins"
      on:click={togglePluginMenu}
    >
      <span class="status-item__icon">🔌</span>
      <span class="status-item__text">{$pluginsStore.plugins.size}</span>
    </button>
  </div>
</div>

{#if showPluginMenu}
  <div
    class="plugin-menu"
    role="dialog"
    aria-modal="true"
    aria-label="Plugin menu"
    on:click={() => (showPluginMenu = false)}
    on:keydown={handlePluginMenuKeydown}
  >
    <div class="plugin-menu__content" on:click|stopPropagation>
      <h3 class="plugin-menu__title">Plugins</h3>
      
      <div class="plugin-list">
        {#each Array.from($pluginsStore.plugins.values()) as plugin (plugin.id)}
          <div class="plugin-item" class:plugin-item--active={plugin.state === 'active'}>
            <div class="plugin-item__header">
              <span class="plugin-item__name">{plugin.name}</span>
              <span class="plugin-item__version">{plugin.version}</span>
            </div>
            
            <div class="plugin-item__state">
              <span class="plugin-item__state-indicator" data-state={plugin.state} />
              <span class="plugin-item__state-text">{plugin.state}</span>
            </div>

            {#if plugin.error}
              <div class="plugin-item__error">{plugin.error}</div>
            {/if}

            <div class="plugin-item__actions">
              {#if plugin.state === 'active'}
                <button
                  class="plugin-action"
                  on:click={() => pluginsStore.deactivate(plugin.id)}
                >
                  Deactivate
                </button>
              {:else if plugin.state === 'loaded'}
                <button
                  class="plugin-action"
                  on:click={() => pluginsStore.activate(plugin.id)}
                >
                  Activate
                </button>
              {/if}
              
              <button
                class="plugin-action"
                on:click={() => pluginsStore.reload(plugin.id)}
              >
                Reload
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: var(--status-bar-height, 24px);
    background: var(--status-bar-bg);
    color: var(--status-bar-fg);
    font-size: 12px;
    padding: 0 8px;
    border-top: 1px solid var(--window-border-color);
    user-select: none;
  }

  .status-bar__left,
  .status-bar__right {
    display: flex;
    gap: 16px;
    align-items: center;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    transition: background var(--transition-hover, 100ms);
  }

  .status-item--clickable {
    cursor: pointer;
    background: transparent;
    border: none;
    color: inherit;
    font: inherit;
  }

  .status-item--clickable:hover {
    background: var(--button-hover);
  }

  .status-item__icon {
    font-size: 14px;
  }

  .status-item__text {
    font-family: var(--font-mono, 'Courier New', monospace);
  }

  .status-item__indicator {
    color: var(--color-warning, #f1fa8c);
    font-size: 16px;
    line-height: 1;
  }

  .plugin-menu {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    z-index: 1000;
  }

  .plugin-menu__content {
    background: var(--chrome-bg);
    border: 1px solid var(--window-border-color);
    border-radius: 8px 8px 0 0;
    padding: 16px;
    max-width: 400px;
    max-height: 60vh;
    overflow-y: auto;
    margin: 0 8px 24px 0;
  }

  .plugin-menu__title {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .plugin-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .plugin-item {
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    border: 1px solid transparent;
  }

  .plugin-item--active {
    border-color: var(--color-info, #00d9ff);
  }

  .plugin-item__header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .plugin-item__name {
    font-weight: 600;
  }

  .plugin-item__version {
    font-size: 11px;
    opacity: 0.6;
  }

  .plugin-item__state {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    margin-bottom: 8px;
  }

  .plugin-item__state-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-info);
  }

  .plugin-item__state-indicator[data-state='active'] {
    background: var(--color-success, #50fa7b);
  }

  .plugin-item__state-indicator[data-state='error'] {
    background: var(--color-error, #ff5555);
  }

  .plugin-item__error {
    font-size: 11px;
    color: var(--color-error, #ff5555);
    margin-bottom: 8px;
  }

  .plugin-item__actions {
    display: flex;
    gap: 6px;
  }

  .plugin-action {
    padding: 4px 12px;
    background: var(--button-bg);
    border: 1px solid var(--input-border);
    border-radius: 4px;
    font-size: 11px;
    cursor: pointer;
    transition: all var(--transition-hover, 100ms);
  }

  .plugin-action:hover {
    background: var(--button-hover);
  }
</style>