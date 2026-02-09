<!-- src/components/Breadcrumb.svelte -->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { icons } from '../lib/icons/index';

  export let filePath: string = '';

  const dispatch = createEventDispatcher<{
    navigate: { path: string };
  }>();

  // Split the file path into segments
  $: segments = filePath ? filePath.replace(/\\/g, '/').split('/').filter(Boolean) : [];

  // Build cumulative paths for each segment
  $: segmentPaths = segments.map((_, i) => segments.slice(0, i + 1).join('/'));

  function handleClick(index: number) {
    dispatch('navigate', { path: segmentPaths[index] });
  }
</script>

{#if segments.length > 0}
  <nav class="breadcrumb" aria-label="File path">
    {#each segments as segment, i (segmentPaths[i])}
      {#if i > 0}
        <span class="breadcrumb__separator" aria-hidden="true">
          {@html icons.chevronDown}
        </span>
      {/if}
      <button
        class="breadcrumb__segment"
        class:breadcrumb__segment--file={i === segments.length - 1}
        title={segmentPaths[i]}
        on:click={() => handleClick(i)}
      >
        {#if i === 0 && segments.length > 1}
          <span class="breadcrumb__icon" aria-hidden="true">
            {@html icons.folder}
          </span>
        {/if}
        {#if i === segments.length - 1}
          <span class="breadcrumb__icon" aria-hidden="true">
            {@html icons.file}
          </span>
        {/if}
        <span class="breadcrumb__text">{segment}</span>
      </button>
    {/each}
  </nav>
{/if}

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 24px;
    min-height: 24px;
    background: var(--chrome-bg, rgba(28, 28, 28, 0.95));
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.06));
    overflow: hidden;
    user-select: none;
    flex-shrink: 0;
  }

  .breadcrumb__separator {
    display: flex;
    align-items: center;
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    margin: 0 1px;
    transform: rotate(-90deg);
  }

  .breadcrumb__separator :global(svg) {
    width: 10px;
    height: 10px;
  }

  .breadcrumb__segment {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 2px 4px;
    background: transparent;
    border: none;
    border-radius: 3px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    font-size: 11px;
    font-family: var(--font-mono, 'Courier New', monospace);
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 100ms ease,
      color 100ms ease;
  }

  .breadcrumb__segment:hover {
    background: var(--button-hover, rgba(255, 255, 255, 0.08));
    color: var(--text-primary, #e4e4e4);
  }

  .breadcrumb__segment--file {
    color: var(--text-primary, #e4e4e4);
    font-weight: 500;
  }

  .breadcrumb__icon {
    display: flex;
    align-items: center;
    opacity: 0.6;
  }

  .breadcrumb__icon :global(svg) {
    width: 12px;
    height: 12px;
  }

  .breadcrumb__text {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
