<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { createDiffEditor, destroyEditor } from '$lib/editor-loader';
  import type { EditorView } from 'codemirror';

  export let original: string;
  export let modified: string;
  export let readOnly: boolean = true;

  let container: HTMLDivElement;
  let originalView: EditorView | null = null;
  let modifiedView: EditorView | null = null;

  async function mountDiff() {
    if (!container) {
      return;
    }

    const editors = await createDiffEditor(container, {
      original,
      modified,
      readOnly,
    });

    originalView = editors.original;
    modifiedView = editors.modified;
  }

  function updateModels() {
    if (!originalView || !modifiedView) {
      return;
    }

    originalView.dispatch({
      changes: {
        from: 0,
        to: originalView.state.doc.length,
        insert: original,
      },
    });

    modifiedView.dispatch({
      changes: {
        from: 0,
        to: modifiedView.state.doc.length,
        insert: modified,
      },
    });
  }

  onMount(async () => {
    await mountDiff();
    updateModels();
  });

  onDestroy(() => {
    if (originalView) {
      destroyEditor(originalView);
      originalView = null;
    }
    if (modifiedView) {
      destroyEditor(modifiedView);
      modifiedView = null;
    }
  });

  $: if (originalView && modifiedView) {
    updateModels();
  }
</script>

<div class="diff-view" bind:this={container}></div>

<style>
  .diff-view {
    height: 100%;
    width: 100%;
  }

  :global(.diff-editor-container) {
    display: flex;
    height: 100%;
  }

  :global(.diff-editor-original),
  :global(.diff-editor-modified) {
    flex: 1;
  }
</style>
