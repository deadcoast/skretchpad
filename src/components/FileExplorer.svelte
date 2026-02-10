<!-- src/components/FileExplorer.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { editorStore, activeTab } from '$lib/stores/editor';
  import { explorerRoot } from '$lib/stores/explorer';
  import { coercePathString } from '$lib/utils/path';
  import { icons } from '../lib/icons/index';
  import FileTreeItem from './FileTreeItem.svelte';

  interface DirEntry {
    name: string;
    path: string;
    is_dir: boolean;
    is_symlink: boolean;
    size: number;
  }

  let rootPath: string = '';
  let rootName: string = '';
  let entries: DirEntry[] = [];
  let loading = true;
  let error: string | null = null;

  $: activePath = $activeTab?.file.path ?? null;

  onMount(async () => {
    await loadRoot();
  });

  $: if ($explorerRoot && $explorerRoot !== rootPath) {
    loadRoot($explorerRoot);
  }

  async function loadRoot(overrideRoot?: string) {
    loading = true;
    error = null;
    try {
      rootPath = overrideRoot || (await invoke<string>('get_workspace_root'));
      // Extract folder name from path (handle both / and \)
      const parts = rootPath.replace(/\\/g, '/').split('/');
      rootName = parts.filter(Boolean).pop() || rootPath;
      entries = await invoke<DirEntry[]>('list_directory', { path: rootPath });
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }

  function handleFileClick(path: string | { path: string }) {
    const raw = coercePathString(path);
    if (!raw) {
      error = 'Invalid file path payload from file explorer';
      return;
    }
    // Normalize Windows backslashes to forward slashes for consistent handling
    const normalized = raw.replace(/\\/g, '/');
    editorStore.openFile(normalized);
  }

  async function refresh() {
    if (!rootPath) return;
    loading = true;
    error = null;
    try {
      entries = await invoke<DirEntry[]>('list_directory', { path: rootPath });
    } catch (e) {
      error = String(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="file-explorer" role="tree" aria-label="File Explorer">
  <div class="file-explorer__header">
    <span class="file-explorer__root-name" title={rootPath}>{rootName}</span>
    <button
      class="file-explorer__refresh"
      on:click={refresh}
      title="Refresh"
      aria-label="Refresh file explorer"
    >
      {@html icons.sync}
    </button>
  </div>

  <div class="file-explorer__tree">
    {#if loading}
      <div class="file-explorer__status">Loading...</div>
    {:else if error}
      <div class="file-explorer__error">
        <p>{error}</p>
        <button class="file-explorer__retry" on:click={() => loadRoot()}>Retry</button>
      </div>
    {:else if entries.length === 0}
      <div class="file-explorer__status">Empty workspace</div>
    {:else}
      {#each entries as entry (entry.path)}
        <FileTreeItem {entry} depth={0} {activePath} onFileClick={handleFileClick} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .file-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    color: var(--text-primary, #e4e4e4);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 28px), transparent;
  }

  .file-explorer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.08));
  }

  .file-explorer__root-name {
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-mono, 'Courier New', monospace);
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-explorer__refresh {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
    cursor: pointer;
    transition:
      color 150ms ease,
      background 150ms ease;
    flex-shrink: 0;
  }

  .file-explorer__refresh :global(svg) {
    width: 14px;
    height: 14px;
  }

  .file-explorer__refresh:hover {
    color: var(--palette-cyan, #75ffcf);
    background: var(--button-hover, rgba(255, 255, 255, 0.06));
  }

  .file-explorer__tree {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb, rgba(255, 255, 255, 0.15)) transparent;
  }

  .file-explorer__status {
    padding: 24px 16px;
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-style: italic;
  }

  .file-explorer__error {
    padding: 16px;
    text-align: center;
    font-size: 12px;
    color: var(--color-error, #ff4444);
  }

  .file-explorer__error p {
    margin: 0 0 8px;
    word-break: break-word;
  }

  .file-explorer__retry {
    padding: 4px 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.15));
    border-radius: 4px;
    color: var(--text-primary, #e4e4e4);
    font-size: 12px;
    cursor: pointer;
    transition: background 150ms ease;
  }

  .file-explorer__retry:hover {
    background: var(--button-hover, rgba(255, 255, 255, 0.1));
  }
</style>
