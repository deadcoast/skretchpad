<!-- src/components/FileTreeItem.svelte -->
<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { icons } from '../lib/icons/index';
  import { getFileVisual } from '$lib/utils/file-types';

  interface DirEntry {
    name: string;
    path: string;
    is_dir: boolean;
    is_symlink: boolean;
    size: number;
  }

  export let entry: DirEntry;
  export let depth: number = 0;
  export let activePath: string | null = null;
  export let onFileClick: (path: string) => void;

  let expanded = false;
  let children: DirEntry[] = [];
  let loaded = false;
  let loading = false;
  let error: string | null = null;

  $: isActive = activePath === entry.path;
  $: paddingLeft = 8 + depth * 16;
  $: fileVisual = getFileVisual(entry.name, entry.is_dir);

  async function toggle() {
    if (!entry.is_dir) {
      onFileClick(entry.path);
      return;
    }

    expanded = !expanded;

    if (expanded && !loaded) {
      loading = true;
      error = null;
      try {
        children = await invoke<DirEntry[]>('list_directory', { path: entry.path });
        loaded = true;
      } catch (e) {
        error = String(e);
        expanded = false;
      } finally {
        loading = false;
      }
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
    if (e.key === 'ArrowRight' && entry.is_dir && !expanded) {
      e.preventDefault();
      toggle();
    }
    if (e.key === 'ArrowLeft' && entry.is_dir && expanded) {
      e.preventDefault();
      toggle();
    }
  }
</script>

<div class="tree-item-container">
  <button
    class="tree-item"
    class:tree-item--active={isActive}
    class:tree-item--dir={entry.is_dir}
    class:tree-item--hidden={fileVisual.category === 'hidden'}
    style="padding-left: {paddingLeft}px"
    on:click={toggle}
    on:keydown={handleKeydown}
    title={entry.path}
    aria-expanded={entry.is_dir ? expanded : undefined}
    aria-selected={isActive}
    role="treeitem"
  >
    {#if entry.is_dir}
      <span class="tree-item__arrow">{expanded ? '▼' : '►'}</span>
    {:else}
      <span class="tree-item__arrow tree-item__arrow--spacer"></span>
    {/if}

    <span class="tree-item__icon">
      {#if entry.is_dir}
        {@html icons.folder}
      {:else}
        <span class={`tree-item__file-icon tree-item__file-icon--${fileVisual.category}`}>
          <span class="tree-item__file-outline">{@html icons.file}</span>
          <span class="tree-item__file-glyph">{fileVisual.glyph}</span>
        </span>
      {/if}
    </span>

    <span class="tree-item__name">{entry.name}</span>
    {#if !entry.is_dir}
      <span class={`tree-item__kind tree-item__kind--${fileVisual.category}`}
        >{fileVisual.badge}</span
      >
    {/if}
  </button>

  {#if entry.is_dir && expanded}
    <div class="tree-item__children" role="group">
      {#if loading}
        <div class="tree-item__loading" style="padding-left: {paddingLeft + 16}px">Loading...</div>
      {:else if error}
        <div class="tree-item__error" style="padding-left: {paddingLeft + 16}px">
          {error}
        </div>
      {:else}
        {#each children as child (child.path)}
          <svelte:self entry={child} depth={depth + 1} {activePath} {onFileClick} />
        {/each}
        {#if children.length === 0}
          <div class="tree-item__empty" style="padding-left: {paddingLeft + 16}px">
            Empty folder
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .tree-item-container {
    display: flex;
    flex-direction: column;
  }

  .tree-item {
    display: flex;
    align-items: center;
    gap: 5px;
    width: 100%;
    height: 25px;
    padding-right: 10px;
    background: transparent;
    border: none;
    color: var(--text-primary, #e4e4e4);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-left: 2px solid transparent;
    transition:
      background 100ms ease,
      border-color 100ms ease;
    outline: none;
  }

  .tree-item:hover {
    background: var(--button-hover, rgba(255, 255, 255, 0.06));
  }

  .tree-item:focus-visible {
    background: var(--button-hover, rgba(255, 255, 255, 0.06));
    border-left-color: var(--input-focus, rgba(255, 255, 255, 0.5));
  }

  .tree-item--active {
    background: var(--button-active, rgba(255, 255, 255, 0.12));
    border-left-color: var(--color-primary, #ffccd5);
    color: var(--text-primary, #fff);
  }

  .tree-item--active:hover {
    background: var(--button-active, rgba(255, 255, 255, 0.12));
  }

  .tree-item__arrow {
    flex-shrink: 0;
    width: 12px;
    font-size: 7px;
    text-align: center;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
    line-height: 1;
  }

  .tree-item__arrow--spacer {
    visibility: hidden;
  }

  .tree-item__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
  }

  .tree-item--active .tree-item__icon {
    color: var(--text-primary, #fff);
  }

  .tree-item--dir .tree-item__icon {
    color: var(--palette-cyan, #75ffcf);
  }

  .tree-item__icon :global(svg) {
    width: 13px;
    height: 13px;
  }

  .tree-item__file-icon,
  .tree-item__kind {
    --tree-accent: var(--text-secondary, rgba(228, 228, 228, 0.65));
  }

  .tree-item__file-icon {
    position: relative;
    width: 13px;
    height: 15px;
    color: var(--tree-accent);
    opacity: 0.9;
  }

  .tree-item__file-outline {
    display: block;
    line-height: 0;
  }

  .tree-item__file-outline :global(svg) {
    width: 13px;
    height: 15px;
    opacity: 0.75;
  }

  .tree-item__file-glyph {
    position: absolute;
    left: 50%;
    bottom: 1.5px;
    transform: translateX(-50%);
    font-size: 5px;
    font-weight: 700;
    font-family: var(--font-mono, 'Courier New', monospace);
    letter-spacing: 0.15px;
    line-height: 1;
    color: var(--tree-accent);
    text-transform: uppercase;
    pointer-events: none;
  }

  .tree-item__kind {
    margin-left: 5px;
    font-size: 8px;
    font-weight: 600;
    font-family: var(--font-mono, 'Courier New', monospace);
    letter-spacing: 0.35px;
    line-height: 1;
    color: var(--tree-accent);
    opacity: 0.7;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .tree-item__file-icon--documentation,
  .tree-item__kind--documentation {
    --tree-accent: var(--palette-blue, #8875ff);
  }

  .tree-item__file-icon--hidden,
  .tree-item__kind--hidden {
    --tree-accent: var(--text-disabled, rgba(255, 255, 255, 0.25));
  }

  .tree-item__file-icon--development,
  .tree-item__kind--development {
    --tree-accent: var(--palette-purple, #ff75c6);
  }

  .tree-item__file-icon--config,
  .tree-item__kind--config {
    --tree-accent: #f2a65a;
    --tree-accent: color-mix(
      in srgb,
      var(--palette-yellow, #fbd58e) 78%,
      var(--palette-red, #ff758f) 22%
    );
  }

  .tree-item__file-icon--font,
  .tree-item__kind--font {
    --tree-accent: var(--palette-cyan, #75ffcf);
  }

  .tree-item__file-icon--media,
  .tree-item__kind--media {
    --tree-accent: var(--palette-green, #e6ff75);
  }

  .tree-item__file-icon--other,
  .tree-item__kind--other {
    --tree-accent: var(--text-secondary, rgba(228, 228, 228, 0.65));
  }

  .tree-item__name {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .tree-item__children {
    display: flex;
    flex-direction: column;
  }

  .tree-item__loading,
  .tree-item__empty {
    height: 24px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-style: italic;
  }

  .tree-item__error {
    height: 24px;
    display: flex;
    align-items: center;
    font-size: 12px;
    color: var(--color-error, #ff4444);
  }

  .tree-item--hidden .tree-item__name {
    color: var(--text-disabled, rgba(255, 255, 255, 0.25));
    opacity: 0.8;
  }

  .tree-item--hidden.tree-item--active .tree-item__name {
    color: var(--text-secondary, rgba(255, 255, 255, 0.55));
    opacity: 0.92;
  }

  .tree-item--hidden .tree-item__kind {
    opacity: 0.5;
  }

  .tree-item--hidden .tree-item__file-icon {
    opacity: 0.72;
  }

  .tree-item--active .tree-item__kind {
    opacity: 1;
  }
</style>
