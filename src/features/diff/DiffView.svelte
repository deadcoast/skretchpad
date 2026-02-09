<!-- src/features/diff/DiffView.svelte -->
<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { createDiffEditor } from '../../lib/editor-loader';
  import { themeStore } from '../../lib/stores/theme';
  import { icons } from '../../lib/icons/index';

  export let original: string;
  export let modified: string;
  export let originalLabel: string = 'Original';
  export let modifiedLabel: string = 'Modified';
  export let language: string | null = null;
  export let mode: 'side-by-side' | 'unified' = 'side-by-side';

  let container: HTMLDivElement;
  let destroyFn: (() => void) | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mergeViewRef: any = null;

  // Stats
  let addedLines = 0;
  let removedLines = 0;

  // Hunk navigation
  let hunks: Array<{ from: number; to: number }> = [];
  let currentHunkIndex = -1;

  const dispatch = createEventDispatcher<{ close: void }>();

  $: totalHunks = hunks.length;

  onMount(() => {
    createView();
    computeStats();
  });

  onDestroy(() => {
    destroyCurrentView();
  });

  async function createView() {
    if (!container) return;
    destroyCurrentView();

    try {
      const theme = $themeStore.current ?? undefined;
      const result = await createDiffEditor(container, {
        original,
        modified,
        theme,
        language: language ?? undefined,
        mode,
      });
      mergeViewRef = result.mergeView;
      destroyFn = result.destroy;

      // Extract hunks after a tick to let the view render
      requestAnimationFrame(() => {
        extractHunks();
      });
    } catch (err) {
      console.error('Failed to create diff editor:', err);
    }
  }

  function destroyCurrentView() {
    if (destroyFn) {
      destroyFn();
      destroyFn = null;
      mergeViewRef = null;
    }
  }

  function computeStats() {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');

    // Simple line-based diff stats
    let added = 0;
    let removed = 0;
    const maxLen = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i];
      const m = modLines[i];
      if (o === undefined && m !== undefined) added++;
      else if (m === undefined && o !== undefined) removed++;
      else if (o !== m) {
        added++;
        removed++;
      }
    }
    addedLines = added;
    removedLines = removed;
  }

  function extractHunks() {
    if (!mergeViewRef) return;

    // Try to find changed chunks from MergeView DOM
    const newHunks: Array<{ from: number; to: number }> = [];
    try {
      const changedLines = container.querySelectorAll('.cm-changedLine');
      let currentStart = -1;
      let lastTop = -1;

      changedLines.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const top = rect.top - containerRect.top;

        if (currentStart === -1 || top - lastTop > 30) {
          if (currentStart !== -1) {
            newHunks.push({ from: currentStart, to: lastTop + 20 });
          }
          currentStart = top;
        }
        lastTop = top;
      });

      if (currentStart !== -1) {
        newHunks.push({ from: currentStart, to: lastTop + 20 });
      }
    } catch {
      // Fallback: no hunks
    }

    hunks = newHunks;
    if (hunks.length > 0) {
      currentHunkIndex = 0;
    }
  }

  function nextHunk() {
    if (hunks.length === 0) return;
    currentHunkIndex = (currentHunkIndex + 1) % hunks.length;
    scrollToHunk(currentHunkIndex);
  }

  function prevHunk() {
    if (hunks.length === 0) return;
    currentHunkIndex = (currentHunkIndex - 1 + hunks.length) % hunks.length;
    scrollToHunk(currentHunkIndex);
  }

  function scrollToHunk(index: number) {
    if (!container || index < 0 || index >= hunks.length) return;
    const hunk = hunks[index];

    // Find the scrollable editor panel
    const scroller = container.querySelector('.cm-scroller') || container;
    if (scroller) {
      scroller.scrollTop = Math.max(0, hunk.from - 40);
    }
  }

  function toggleMode() {
    mode = mode === 'side-by-side' ? 'unified' : 'side-by-side';
    createView();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      nextHunk();
    } else if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      prevHunk();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      dispatch('close');
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="diff-view">
  <div class="diff-header">
    <div class="diff-header__labels">
      <span class="diff-label diff-label--original">{originalLabel}</span>
      <span class="diff-label diff-label--vs">vs</span>
      <span class="diff-label diff-label--modified">{modifiedLabel}</span>
    </div>

    <div class="diff-header__stats">
      <span class="diff-stat diff-stat--added">+{addedLines}</span>
      <span class="diff-stat diff-stat--removed">-{removedLines}</span>
    </div>

    <div class="diff-header__nav">
      <button
        class="diff-nav-btn"
        on:click={prevHunk}
        title="Previous Change (Alt+Up)"
        aria-label="Previous change"
        disabled={totalHunks === 0}
      >
        {@html icons.chevronUp}
      </button>
      <span class="diff-nav-counter">
        {totalHunks > 0 ? `${currentHunkIndex + 1}/${totalHunks}` : '0/0'}
      </span>
      <button
        class="diff-nav-btn"
        on:click={nextHunk}
        title="Next Change (Alt+Down)"
        aria-label="Next change"
        disabled={totalHunks === 0}
      >
        {@html icons.chevronDown}
      </button>

      <div class="diff-nav-divider"></div>

      <button
        class="diff-nav-btn"
        on:click={toggleMode}
        title="Toggle {mode === 'side-by-side' ? 'unified' : 'side-by-side'} mode"
        aria-label="Toggle diff mode"
      >
        {@html mode === 'side-by-side' ? icons.rows : icons.columns}
      </button>

      <button
        class="diff-nav-btn"
        on:click={() => dispatch('close')}
        title="Close (Escape)"
        aria-label="Close diff view"
      >
        {@html icons.close}
      </button>
    </div>
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
    padding: 4px 12px;
    gap: 12px;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.85));
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
  }

  .diff-header__labels {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .diff-label {
    font-size: 12px;
    font-family: var(--font-mono, monospace);
    padding: 2px 8px;
    border-radius: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .diff-label--original {
    color: var(--color-error, #ff6b6b);
    background: rgba(255, 107, 107, 0.1);
  }

  .diff-label--modified {
    color: var(--color-success, #51cf66);
    background: rgba(81, 207, 102, 0.1);
  }

  .diff-label--vs {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-size: 11px;
    padding: 0;
  }

  .diff-header__stats {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .diff-stat {
    font-size: 11px;
    font-family: var(--font-mono, monospace);
    font-weight: 600;
  }

  .diff-stat--added {
    color: var(--color-success, #51cf66);
  }

  .diff-stat--removed {
    color: var(--color-error, #ff6b6b);
  }

  .diff-header__nav {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .diff-nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    cursor: pointer;
    border-radius: 4px;
    transition: all 150ms ease;
  }

  .diff-nav-btn :global(svg) {
    width: 14px;
    height: 14px;
  }

  .diff-nav-btn:hover:not(:disabled) {
    color: var(--text-primary, #e4e4e4);
    background: rgba(255, 255, 255, 0.1);
  }

  .diff-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .diff-nav-counter {
    font-size: 11px;
    font-family: var(--font-mono, monospace);
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    min-width: 32px;
    text-align: center;
  }

  .diff-nav-divider {
    width: 1px;
    height: 16px;
    background: var(--window-border-color, rgba(255, 255, 255, 0.1));
    margin: 0 4px;
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

  /* Ensure diff editor text is visible */
  :global(.cm-mergeViewEditor .cm-editor) {
    background: var(--editor-bg, transparent);
    color: var(--editor-fg, #ffffff);
  }

  :global(.cm-mergeViewEditor .cm-content) {
    color: var(--editor-fg, #ffffff);
  }

  :global(.cm-mergeViewEditor .cm-gutters) {
    background: var(--gutter-bg, rgba(0, 0, 0, 0.15));
    color: var(--line-number, rgba(255, 255, 255, 0.25));
    border-right: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  }

  :global(.cm-mergeViewEditor .cm-scroller) {
    overflow-x: hidden !important;
  }

  :global(.cm-mergeViewEditor .cm-scroller::-webkit-scrollbar) {
    width: 6px;
    height: 0;
  }

  :global(.cm-mergeViewEditor .cm-scroller::-webkit-scrollbar-thumb) {
    background: var(--scrollbar-thumb, rgba(255, 255, 255, 0.12));
    border-radius: 3px;
  }

  :global(.cm-collapsedLines) {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    background: var(--gutter-bg, rgba(0, 0, 0, 0.2));
    cursor: pointer;
  }

  /* Unified diff mode styles */
  :global(.cm-deletedChunk) {
    background: rgba(255, 107, 107, 0.12);
  }

  :global(.cm-insertedChunk) {
    background: rgba(81, 207, 102, 0.12);
  }
</style>
