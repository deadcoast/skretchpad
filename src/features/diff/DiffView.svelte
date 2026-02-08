<!-- src/features/diff/DiffView.svelte -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { createDiffEditor } from '../../lib/editor-loader';
  import { icons } from '../../lib/icons/index';

  export let original: string;
  export let modified: string;
  export let originalLabel: string = 'Original';
  export let modifiedLabel: string = 'Modified';

  let container: HTMLDivElement;
  let destroyFn: (() => void) | null = null;

  const dispatch = createEventDispatcher<{ close: void }>();

  onMount(async () => {
    if (!container) return;

    try {
      const result = await createDiffEditor(container, { original, modified });
      destroyFn = result.destroy;
    } catch (err) {
      console.error('Failed to create diff editor:', err);
    }
  });

  onDestroy(() => {
    if (destroyFn) {
      destroyFn();
      destroyFn = null;
    }
  });
</script>

<div class="diff-view">
  <div class="diff-header">
    <div class="diff-header-labels">
      <span class="diff-label diff-label--original">{originalLabel}</span>
      <span class="diff-label diff-label--modified">{modifiedLabel}</span>
    </div>
    <button class="diff-close" on:click={() => dispatch('close')} title="Close diff view" aria-label="Close diff view">
      {@html icons.close}
    </button>
  </div>
  <div class="diff-container" bind:this={container}></div>
</div>

<style>
  .diff-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: var(--editor-bg, #1e1e1e);
  }

  .diff-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.85));
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
  }

  .diff-header-labels {
    display: flex;
    gap: 24px;
    flex: 1;
  }

  .diff-label {
    font-size: 12px;
    font-family: monospace;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .diff-label--original {
    color: var(--color-error, #ff6b6b);
    background: rgba(255, 107, 107, 0.1);
  }

  .diff-label--modified {
    color: var(--color-success, #51cf66);
    background: rgba(81, 207, 102, 0.1);
  }

  .diff-close {
    background: transparent;
    border: none;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 150ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .diff-close :global(svg) {
    width: 16px;
    height: 16px;
  }

  .diff-close:hover {
    color: var(--text-primary, #e4e4e4);
    background: rgba(255, 255, 255, 0.1);
  }

  .diff-container {
    flex: 1;
    overflow: hidden;
  }

  /* MergeView styling */
  :global(.cm-merge-a .cm-changedLine) {
    background: rgba(255, 107, 107, 0.12);
  }

  :global(.cm-merge-b .cm-changedLine) {
    background: rgba(81, 207, 102, 0.12);
  }

  :global(.cm-merge-a .cm-changedText) {
    background: rgba(255, 107, 107, 0.25);
  }

  :global(.cm-merge-b .cm-changedText) {
    background: rgba(81, 207, 102, 0.25);
  }

  :global(.cm-merge-spacer) {
    background: var(--gutter-bg, rgba(0, 0, 0, 0.2));
  }

  :global(.cm-mergeView) {
    height: 100%;
  }

  :global(.cm-mergeViewEditors) {
    height: 100%;
  }

  :global(.cm-mergeViewEditor) {
    height: 100%;
    overflow: auto;
  }

  :global(.cm-collapsedLines) {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    background: var(--gutter-bg, rgba(0, 0, 0, 0.2));
    cursor: pointer;
  }
</style>
