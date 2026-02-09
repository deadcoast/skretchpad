<!-- src/components/Minimap.svelte -->
<!-- Canvas-based code minimap that renders a zoomed-out overview of the document -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { EditorView } from '@codemirror/view';

  export let editorView: EditorView | null = null;
  export let visible: boolean = true;

  let canvas: HTMLCanvasElement;
  let container: HTMLElement;
  let isDragging = false;
  let animationFrame: number | null = null;

  // Minimap rendering constants
  const CHAR_WIDTH = 1.2;
  const LINE_HEIGHT = 2.5;
  const MINIMAP_WIDTH = 80;
  const MAX_LINE_CHARS = 60; // chars rendered per line

  $: if (editorView && canvas && visible) {
    scheduleRender();
  }

  onMount(() => {
    if (canvas) {
      scheduleRender();
    }
  });

  onDestroy(() => {
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
    }
    if (renderInterval) {
      clearInterval(renderInterval);
    }
  });

  function scheduleRender() {
    if (animationFrame !== null) return;
    animationFrame = requestAnimationFrame(() => {
      animationFrame = null;
      render();
    });
  }

  function render() {
    if (!canvas || !editorView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const doc = editorView.state.doc;
    const totalLines = doc.lines;
    const canvasHeight = Math.min(totalLines * LINE_HEIGHT, container?.clientHeight || 600);

    // Set canvas size (with device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = MINIMAP_WIDTH * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${MINIMAP_WIDTH}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, MINIMAP_WIDTH, canvasHeight);

    // Get syntax highlighting colors from CSS variables
    const style = getComputedStyle(document.documentElement);
    const textColor = style.getPropertyValue('--editor-fg').trim() || '#e4e4e4';

    // Render lines
    for (let i = 1; i <= totalLines; i++) {
      const line = doc.line(i);
      const text = line.text;
      const y = (i - 1) * LINE_HEIGHT;

      if (y > canvasHeight) break;

      // Render each character block
      let x = 4; // left margin
      for (let j = 0; j < Math.min(text.length, MAX_LINE_CHARS); j++) {
        const ch = text[j];
        if (ch === ' ' || ch === '\t') {
          x += ch === '\t' ? CHAR_WIDTH * 4 : CHAR_WIDTH;
          continue;
        }

        // Use subtle color variation based on character type
        if (/[a-zA-Z_$]/.test(ch)) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.5;
        } else if (/[0-9]/.test(ch)) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.4;
        } else if (/[{}()[\]]/.test(ch)) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.35;
        } else {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.3;
        }

        ctx.fillRect(x, y, CHAR_WIDTH, LINE_HEIGHT - 0.5);
        x += CHAR_WIDTH;
      }
    }

    ctx.globalAlpha = 1;

    // Render viewport indicator
    const scrollInfo = getViewportInfo();
    if (scrollInfo) {
      const { topLine, bottomLine } = scrollInfo;
      const vpTop = (topLine - 1) * LINE_HEIGHT;
      const vpHeight = Math.max((bottomLine - topLine + 1) * LINE_HEIGHT, 10);

      // Viewport rectangle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, vpTop, MINIMAP_WIDTH, vpHeight);

      // Viewport border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, vpTop + 0.5, MINIMAP_WIDTH - 1, vpHeight - 1);
    }
  }

  function getViewportInfo(): { topLine: number; bottomLine: number } | null {
    if (!editorView) return null;

    const { from, to } = editorView.viewport;
    const topLine = editorView.state.doc.lineAt(from).number;
    const bottomLine = editorView.state.doc.lineAt(to).number;

    return { topLine, bottomLine };
  }

  function handleMouseDown(e: MouseEvent) {
    isDragging = true;
    scrollToPosition(e);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return;
    scrollToPosition(e);
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function scrollToPosition(e: MouseEvent) {
    if (!editorView || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const totalLines = editorView.state.doc.lines;
    const canvasHeight = parseFloat(canvas.style.height);

    // Calculate target line
    const ratio = y / canvasHeight;
    const targetLine = Math.max(1, Math.min(Math.round(ratio * totalLines), totalLines));

    // Scroll to line (center it in viewport)
    const line = editorView.state.doc.line(targetLine);
    editorView.dispatch({
      selection: { anchor: line.from },
      scrollIntoView: true,
    });

    scheduleRender();
  }

  // Re-render on editor scroll and content changes via polling
  let renderInterval: ReturnType<typeof setInterval> | null = null;

  $: {
    // Clean up previous interval on reactive change
    if (renderInterval) {
      clearInterval(renderInterval);
      renderInterval = null;
    }
    if (editorView && visible) {
      renderInterval = setInterval(() => {
        scheduleRender();
      }, 150);
    }
  }
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

{#if visible && editorView}
  <div class="minimap" bind:this={container}>
    <canvas bind:this={canvas} class="minimap__canvas" on:mousedown={handleMouseDown} />
  </div>
{/if}

<style>
  .minimap {
    position: relative;
    width: 80px;
    min-width: 80px;
    flex-shrink: 0;
    overflow: hidden;
    background: var(--chrome-bg, rgba(28, 28, 28, 0.95));
    border-left: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.06));
  }

  .minimap__canvas {
    cursor: pointer;
    display: block;
  }
</style>
