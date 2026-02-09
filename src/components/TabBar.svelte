<!-- src/components/TabBar.svelte -->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Tab } from '$lib/stores/editor';
  import { icons } from '../lib/icons/index';

  export let tabs: Tab[] = [];
  export let activeTabId: string | null = null;

  const dispatch = createEventDispatcher<{
    switchTab: { tabId: string };
    closeTab: { tabId: string };
    newTab: void;
  }>();

  function handleTabClick(tabId: string) {
    dispatch('switchTab', { tabId });
  }

  function handleCloseClick(e: MouseEvent, tabId: string) {
    e.stopPropagation();
    dispatch('closeTab', { tabId });
  }

  function handleAuxClick(e: MouseEvent, tabId: string) {
    if (e.button === 1) {
      e.preventDefault();
      dispatch('closeTab', { tabId });
    }
  }

  function handleNewTab() {
    dispatch('newTab');
  }
</script>

<div class="tab-bar" role="tablist" aria-label="Open files">
  {#each tabs as tab (tab.id)}
    <button
      class="tab"
      class:tab--active={tab.id === activeTabId}
      class:tab--dirty={tab.file.isDirty}
      role="tab"
      aria-selected={tab.id === activeTabId}
      title={tab.file.path || tab.file.name}
      on:click={() => handleTabClick(tab.id)}
      on:auxclick={(e) => handleAuxClick(e, tab.id)}
    >
      <span class="tab__name">{tab.file.name}</span>
      {#if tab.file.isDirty}
        <span class="tab__dirty-dot" aria-label="Unsaved changes"></span>
      {/if}
      <button
        class="tab__close"
        on:click={(e) => handleCloseClick(e, tab.id)}
        aria-label="Close {tab.file.name}"
        title="Close"
      >
        {@html icons.close}
      </button>
    </button>
  {/each}
  <button class="tab-bar__new" on:click={handleNewTab} title="New File" aria-label="New File">
    +
  </button>
</div>

<style>
  .tab-bar {
    display: flex;
    align-items: center;
    height: 32px;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.85));
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.1));
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    user-select: none;
  }

  .tab-bar::-webkit-scrollbar {
    height: 2px;
  }

  .tab-bar::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.12));
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 100%;
    padding: 0 10px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    font-size: 12px;
    font-family: var(--font-mono, 'Courier New', monospace);
    cursor: pointer;
    white-space: nowrap;
    max-width: 180px;
    position: relative;
    transition:
      background 150ms ease,
      color 150ms ease,
      border-color 150ms ease;
    flex-shrink: 0;
  }

  .tab:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-primary, #e4e4e4);
  }

  .tab--active {
    border-bottom-color: var(--color-info, #00d9ff);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary, #e4e4e4);
  }

  .tab__name {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tab__dirty-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-warning, #f1fa8c);
    flex-shrink: 0;
  }

  /* Hide dirty dot when hovering (close button appears) */
  .tab:hover .tab__dirty-dot {
    display: none;
  }

  .tab__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 3px;
    color: inherit;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 150ms ease,
      background 150ms ease;
    flex-shrink: 0;
  }

  .tab__close :global(svg) {
    width: 10px;
    height: 10px;
  }

  .tab:hover .tab__close {
    opacity: 0.7;
  }

  .tab__close:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.1);
  }

  /* When dirty and not hovered, show dot instead of close */
  .tab--dirty .tab__close {
    opacity: 0;
  }

  .tab--dirty:hover .tab__close {
    opacity: 0.7;
  }

  .tab-bar__new {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0 4px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    font-size: 16px;
    cursor: pointer;
    transition:
      background 150ms ease,
      color 150ms ease;
    flex-shrink: 0;
  }

  .tab-bar__new:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text-primary, #e4e4e4);
  }
</style>
