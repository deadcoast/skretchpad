// src/features/diff/DiffView.svelte
<script lang="ts">
  import { createDiffEditor } from 'monaco-editor';
  
  export let original: string;
  export let modified: string;
  
  let diffEditor;
  
  onMount(() => {
    diffEditor = createDiffEditor(container, {
      theme: 'glass-dark',
      readOnly: false,
      renderSideBySide: true,
      // Minimal UI
      lineNumbers: 'on',
      minimap: { enabled: false },
      scrollbar: { vertical: 'hidden' }
    });
    
    diffEditor.setModel({
      original: monaco.editor.createModel(original),
      modified: monaco.editor.createModel(modified)
    });
  });
</script>