<!-- src/components/SplitPane.svelte -->
<!-- Resizable split pane container for side-by-side or vertical editor splits -->

<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';

  export let direction: 'horizontal' | 'vertical' = 'horizontal';
  export let initialRatio: number = 0.5; // 0.0 - 1.0

  const dispatch = createEventDispatcher<{
    resize: { ratio: number };
  }>();

  let container: HTMLElement;
  let ratio = initialRatio;
  let isDragging = false;

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    isDragging = true;
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !container) return;

    const rect = container.getBoundingClientRect();

    if (direction === 'horizontal') {
      ratio = Math.max(0.15, Math.min(0.85, (e.clientX - rect.left) / rect.width));
    } else {
      ratio = Math.max(0.15, Math.min(0.85, (e.clientY - rect.top) / rect.height));
    }

    dispatch('resize', { ratio });
  }

  function handleMouseUp() {
    if (isDragging) {
      isDragging = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  // Cleanup
  onDestroy(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<div
  class="split-pane"
  class:split-pane--horizontal={direction === 'horizontal'}
  class:split-pane--vertical={direction === 'vertical'}
  bind:this={container}
>
  <div
    class="split-pane__panel split-pane__panel--first"
    style={direction === 'horizontal' ? `width: ${ratio * 100}%` : `height: ${ratio * 100}%`}
  >
    <slot name="first" />
  </div>

  <!-- svelte-ignore a11y-no-noninteractive-tabindex a11y-no-noninteractive-element-interactions -->
  <div
    class="split-pane__divider"
    class:split-pane__divider--dragging={isDragging}
    on:mousedown={handleMouseDown}
    role="separator"
    aria-orientation={direction}
    aria-valuenow={Math.round(ratio * 100)}
    tabindex="0"
  />

  <div class="split-pane__panel split-pane__panel--second" style="flex: 1;">
    <slot name="second" />
  </div>
</div>

<style>
  .split-pane {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    min-width: 0;
  }

  .split-pane--horizontal {
    flex-direction: row;
  }

  .split-pane--vertical {
    flex-direction: column;
  }

  .split-pane__panel {
    overflow: hidden;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .split-pane__divider {
    flex-shrink: 0;
    background: var(--window-border-color, rgba(255, 255, 255, 0.06));
    transition: background 150ms ease;
    z-index: 10;
  }

  .split-pane--horizontal > .split-pane__divider {
    width: 3px;
    cursor: col-resize;
  }

  .split-pane--vertical > .split-pane__divider {
    height: 3px;
    cursor: row-resize;
  }

  .split-pane__divider:hover,
  .split-pane__divider--dragging {
    background: var(--color-info, #00d9ff);
  }
</style>
