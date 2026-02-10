<!-- src/lib/components/Sidebar.svelte -->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { pluginsStore, visiblePanels } from '$lib/stores/plugins';
  import { totalChanges } from '$lib/stores/git';
  import { icons } from '../lib/icons/index';
  import SourceControlPanel from './SourceControlPanel.svelte';
  import FileExplorer from './FileExplorer.svelte';

  export let visible = true;
  export let activeSidebarPanel: string = 'explorer';

  const dispatch = createEventDispatcher<{
    openDiff: { path: string; staged: boolean };
    panelChange: { panel: string };
  }>();

  // Get visible plugin panels
  $: pluginPanels = $visiblePanels.filter((panel) => panel.position === 'sidebar');

  function setActivePanel(panelId: string) {
    activeSidebarPanel = panelId;
    dispatch('panelChange', { panel: panelId });
  }

  function closePluginPanel(panelId: string) {
    pluginsStore.hidePanel(panelId);
  }

  function handleDiff(e: CustomEvent<{ path: string; staged: boolean }>) {
    dispatch('openDiff', e.detail);
  }
</script>

<aside class="sidebar" class:sidebar--visible={visible} aria-label="Sidebar">
  <!-- Activity bar: icon strip -->
  <div class="activity-bar">
    <button
      class="activity-icon"
      class:activity-icon--active={activeSidebarPanel === 'explorer'}
      title="Explorer"
      aria-label="Explorer"
      on:click={() => setActivePanel('explorer')}
    >
      {@html icons.folder}
    </button>

    <button
      class="activity-icon"
      class:activity-icon--active={activeSidebarPanel === 'scm'}
      title="Source Control"
      aria-label="Source Control"
      on:click={() => setActivePanel('scm')}
    >
      {@html icons.gitBranch}
      {#if $totalChanges > 0}
        <span class="activity-badge">{$totalChanges > 99 ? '99+' : $totalChanges}</span>
      {/if}
    </button>

    <!-- Plugin panel icons -->
    {#if pluginPanels.length > 0}
      <div class="activity-separator"></div>
      {#each pluginPanels as panel (panel.id)}
        <button
          class="activity-icon"
          class:activity-icon--active={activeSidebarPanel === panel.id}
          title={panel.title}
          aria-label={panel.title}
          on:click={() => setActivePanel(panel.id)}
        >
          {@html icons.plugin}
        </button>
      {/each}
    {/if}
  </div>

  <!-- Panel content -->
  <div class="sidebar__content">
    {#if activeSidebarPanel === 'explorer'}
      <div class="sidebar__panel">
        <div class="sidebar__panel-body">
          <FileExplorer />
        </div>
      </div>
    {:else if activeSidebarPanel === 'scm'}
      <div class="sidebar__panel">
        <div class="sidebar__panel-header">
          <h3 class="sidebar__panel-title">Source Control</h3>
        </div>
        <div class="sidebar__panel-body">
          <SourceControlPanel on:openDiff={handleDiff} />
        </div>
      </div>
    {:else}
      <!-- Plugin panel -->
      {#each pluginPanels as panel (panel.id)}
        {#if activeSidebarPanel === panel.id}
          <div class="sidebar__panel">
            <div class="sidebar__panel-header">
              <h3 class="sidebar__panel-title">{panel.title}</h3>
              <button
                class="sidebar__panel-close"
                on:click={() => closePluginPanel(panel.id)}
                aria-label="Close panel"
              >
                {@html icons.close}
              </button>
            </div>
            <div class="sidebar__panel-content">
              {#if panel.content}
                <div class="sidebar__plugin-html">{@html panel.content}</div>
              {:else}
                <div class="sidebar__panel-placeholder">
                  <p>Panel: {panel.id}</p>
                  <p>Plugin: {panel.plugin_id}</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    display: flex;
    flex-direction: row;
    width: 0;
    min-width: 0;
    background: var(--chrome-bg);
    color: var(--text-primary, #e4e4e4);
    border-right: none;
    overflow: hidden;
    transition:
      width 200ms ease-out,
      min-width 200ms ease-out,
      border-right 200ms ease-out;
    flex-shrink: 0;
  }

  .sidebar--visible {
    width: 300px;
    min-width: 300px;
    border-right: 1px solid var(--window-border-color);
  }

  /* Activity bar */
  .activity-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 40px;
    min-width: 40px;
    padding: 4px 0;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.85));
    border-right: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.06));
    flex-shrink: 0;
  }

  .activity-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin: 1px 0;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    border-radius: 0;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
    cursor: pointer;
    transition:
      color 150ms ease,
      border-color 150ms ease;
  }

  .activity-icon :global(svg) {
    width: 20px;
    height: 20px;
  }

  .activity-icon:hover {
    color: var(--text-primary, #e4e4e4);
  }

  .activity-icon--active {
    color: var(--text-primary, #e4e4e4);
    border-left-color: var(--color-info, #00d9ff);
  }

  .activity-badge {
    position: absolute;
    top: 4px;
    right: 3px;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
    background: var(--color-info, #00d9ff);
    color: #000;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    border-radius: 7px;
  }

  .activity-separator {
    width: 20px;
    height: 1px;
    margin: 6px 0;
    background: var(--window-border-color, rgba(255, 255, 255, 0.1));
  }

  /* Panel content */
  .sidebar__content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 0;
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
    padding: 8px 12px;
    border-bottom: 1px solid var(--window-border-color);
    flex-shrink: 0;
  }

  .sidebar__panel-title {
    margin: 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
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

  .sidebar__panel-body {
    flex: 1;
    overflow: hidden;
  }

  .sidebar__panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .sidebar__panel-placeholder {
    color: var(--editor-fg);
    opacity: 0.4;
    text-align: center;
    padding: 32px 16px;
    font-size: 12px;
  }

  /* Plugin HTML content - scoped styling */
  .sidebar__plugin-html {
    padding: 8px 12px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--editor-fg);
    overflow-y: auto;
    word-wrap: break-word;
  }

  .sidebar__plugin-html :global(a) {
    color: var(--color-info, #00d9ff);
    text-decoration: none;
  }

  .sidebar__plugin-html :global(a:hover) {
    text-decoration: underline;
  }

  .sidebar__plugin-html :global(button) {
    background: var(--button-bg, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, #e4e4e4);
    border: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.1));
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    cursor: pointer;
  }

  .sidebar__plugin-html :global(code) {
    background: rgba(255, 255, 255, 0.06);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 11px;
  }

  .sidebar__plugin-html :global(pre) {
    background: rgba(0, 0, 0, 0.3);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
