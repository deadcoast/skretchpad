<!-- src/components/ChangeItem.svelte -->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GitFileChange } from '$lib/stores/git';
  import { icons } from '../lib/icons/index';

  export let change: GitFileChange;
  export let staged: boolean = false;

  const dispatch = createEventDispatcher<{
    click: { path: string; staged: boolean };
    stage: { path: string };
    unstage: { path: string };
    discard: { path: string };
  }>();

  $: fileName = change.path.split(/[/\\]/).pop() || change.path;
  $: dirPath = change.path.includes('/')
    ? change.path.substring(0, change.path.lastIndexOf('/'))
    : '';

  $: badgeColor =
    {
      M: 'var(--color-warning, #f1fa8c)',
      A: 'var(--color-success, #51cf66)',
      D: 'var(--color-error, #ff6b6b)',
      R: 'var(--color-info, #00d9ff)',
      C: 'var(--color-info, #00d9ff)',
      U: 'var(--color-error, #ff6b6b)',
    }[change.status] || 'var(--text-secondary)';
</script>

<div
  class="change-item"
  role="button"
  tabindex="0"
  on:click={() => dispatch('click', { path: change.path, staged })}
  on:keydown={(e) => e.key === 'Enter' && dispatch('click', { path: change.path, staged })}
>
  <span class="change-item__badge" style:color={badgeColor}>{change.status}</span>
  <span class="change-item__name">{fileName}</span>
  {#if dirPath}
    <span class="change-item__dir">{dirPath}</span>
  {/if}

  <div class="change-item__actions">
    {#if staged}
      <button
        class="change-item__action"
        title="Unstage"
        aria-label="Unstage {fileName}"
        on:click|stopPropagation={() => dispatch('unstage', { path: change.path })}
      >
        {@html icons.minus}
      </button>
    {:else}
      <button
        class="change-item__action"
        title="Stage"
        aria-label="Stage {fileName}"
        on:click|stopPropagation={() => dispatch('stage', { path: change.path })}
      >
        {@html icons.plus}
      </button>
      <button
        class="change-item__action change-item__action--danger"
        title="Discard Changes"
        aria-label="Discard changes to {fileName}"
        on:click|stopPropagation={() => dispatch('discard', { path: change.path })}
      >
        {@html icons.discard}
      </button>
    {/if}
  </div>
</div>

<style>
  .change-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 100ms ease;
    font-size: 12px;
  }

  .change-item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .change-item__badge {
    font-weight: 700;
    font-size: 11px;
    font-family: var(--font-mono, monospace);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .change-item__name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change-item__dir {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .change-item__actions {
    display: flex;
    gap: 2px;
    margin-left: auto;
    opacity: 0;
    transition: opacity 100ms ease;
    flex-shrink: 0;
  }

  .change-item:hover .change-item__actions {
    opacity: 1;
  }

  .change-item__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 3px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    cursor: pointer;
    transition:
      background 100ms ease,
      color 100ms ease;
  }

  .change-item__action :global(svg) {
    width: 12px;
    height: 12px;
  }

  .change-item__action:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #e4e4e4);
  }

  .change-item__action--danger:hover {
    color: var(--color-error, #ff6b6b);
  }
</style>
