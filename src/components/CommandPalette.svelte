<!-- src/components/CommandPalette.svelte -->
<script lang="ts">
  import { commandsByCategory, type PluginCommand } from '$lib/stores/plugins';
  import type {
    PaletteExecuteDetail,
    PaletteFileItem,
    PaletteMode,
    PaletteSymbolItem,
  } from '$lib/types/command-palette';
  import { formatShortcut } from '$lib/utils/ui';
  import { createEventDispatcher } from 'svelte';

  export let visible = false;
  export let mode: PaletteMode = 'commands';
  export let initialQuery = '';
  export let workspaceFiles: PaletteFileItem[] = [];
  export let symbols: PaletteSymbolItem[] = [];

  const dispatch = createEventDispatcher<{
    execute: PaletteExecuteDetail;
    close: void;
  }>();

  let searchQuery = '';
  let selectedIndex = 0;
  let inputElement: HTMLInputElement;
  let lastVisible = false;
  let lastMode: PaletteMode = mode;

  type PaletteCommand = PluginCommand & { category: string };
  type CommandResult = PaletteCommand & { type: 'command' };
  type FileResult = PaletteFileItem & { type: 'file'; score: number };
  type SymbolResult = PaletteSymbolItem & { type: 'symbol' };

  const MAX_FILE_RESULTS = 250;
  let allCommands: CommandResult[] = [];
  let filteredCommands: CommandResult[] = [];
  let filteredFileResults: FileResult[] = [];
  let filteredSymbolResults: SymbolResult[] = [];
  let currentResultsLength = 0;

  $: if (visible && !lastVisible) {
    searchQuery = initialQuery;
    selectedIndex = 0;
  }
  $: if (visible && mode !== lastMode) {
    lastMode = mode;
    searchQuery = initialQuery;
    selectedIndex = 0;
  }
  $: lastVisible = visible;

  $: if (visible && inputElement) {
    inputElement.focus();
    queueMicrotask(() => {
      if (inputElement && document.contains(inputElement)) {
        inputElement.setSelectionRange(searchQuery.length, searchQuery.length);
      }
    });
  }

  // Get all commands
  $: allCommands = Array.from($commandsByCategory.entries()).flatMap(([category, commands]) =>
    commands.map((cmd) => ({ ...cmd, category, type: 'command' as const }))
  );

  $: normalizedQuery = stripModePrefix(searchQuery).toLowerCase().trim();
  $: effectiveMode = resolveMode(mode, searchQuery);
  $: filteredCommands = buildFilteredCommands();
  $: filteredFileResults = buildFilteredFiles();
  $: filteredSymbolResults = buildFilteredSymbols();
  $: currentResultsLength =
    effectiveMode === 'commands'
      ? filteredCommands.length
      : effectiveMode === 'files'
        ? filteredFileResults.length
        : filteredSymbolResults.length;
  $: if (selectedIndex >= currentResultsLength) {
    selectedIndex = Math.max(currentResultsLength - 1, 0);
  }
  $: groupedCommands =
    effectiveMode === 'commands'
      ? filteredCommands.reduce(
          (acc, cmd) => {
            if (!acc[cmd.category]) {
              acc[cmd.category] = [];
            }
            acc[cmd.category].push(cmd);
            return acc;
          },
          {} as Record<string, CommandResult[]>
        )
      : {};

  function stripModePrefix(query: string): string {
    const first = query.trim().charAt(0);
    if (first === '#' || first === '@' || first === '>') {
      return query.trim().slice(1);
    }
    return query;
  }

  function resolveMode(baseMode: PaletteMode, query: string): PaletteMode {
    const first = query.trim().charAt(0);
    if (first === '#') return 'files';
    if (first === '@') return 'symbols';
    if (first === '>') return 'commands';
    return baseMode;
  }

  function scoreFuzzy(target: string, query: string): number {
    if (!query) return 1;
    const t = target.toLowerCase();
    const q = query.toLowerCase();

    if (t.includes(q)) {
      const idx = t.indexOf(q);
      return 1000 - idx * 2 - (t.length - q.length);
    }

    let qi = 0;
    let score = 0;
    let streak = 0;
    for (let i = 0; i < t.length && qi < q.length; i += 1) {
      if (t[i] === q[qi]) {
        qi += 1;
        streak += 1;
        score += 8 + streak * 3;
      } else {
        streak = 0;
      }
    }
    return qi === q.length ? score : -1;
  }

  function buildFilteredCommands(): CommandResult[] {
    return allCommands.filter((cmd) => {
      const query = normalizedQuery;
      return (
        cmd.label.toLowerCase().includes(query) ||
        cmd.id.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
      );
    });
  }

  function buildFilteredFiles(): FileResult[] {
    return workspaceFiles
      .map((file) => {
        const score = Math.max(
          scoreFuzzy(file.relativePath, normalizedQuery),
          scoreFuzzy(file.name, normalizedQuery) + 4
        );
        return { ...file, type: 'file' as const, score };
      })
      .filter((file) => file.score >= 0)
      .sort((a, b) => b.score - a.score || a.relativePath.localeCompare(b.relativePath))
      .slice(0, MAX_FILE_RESULTS);
  }

  function buildFilteredSymbols(): SymbolResult[] {
    return symbols
      .filter((symbol) => symbol.name.toLowerCase().includes(normalizedQuery))
      .map((symbol) => ({ ...symbol, type: 'symbol' as const }));
  }

  function clampSelection(next: number) {
    const max = Math.max(currentResultsLength - 1, 0);
    selectedIndex = Math.max(0, Math.min(next, max));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      clampSelection(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      clampSelection(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    }
  }

  function executeSelected() {
    if (effectiveMode === 'commands') {
      const selected = filteredCommands[selectedIndex];
      if (!selected) return;
      dispatch('execute', { type: 'command', commandId: selected.id });
    } else if (effectiveMode === 'files') {
      const selected = filteredFileResults[selectedIndex];
      if (!selected) return;
      dispatch('execute', { type: 'file', path: selected.path });
    } else {
      const selected = filteredSymbolResults[selectedIndex];
      if (!selected) return;
      dispatch('execute', { type: 'symbol', line: selected.line });
    }
    close();
  }

  function close() {
    visible = false;
    searchQuery = '';
    selectedIndex = 0;
    dispatch('close');
  }

  function handleBackdropClick() {
    close();
  }

  function getPlaceholder() {
    if (effectiveMode === 'files') return 'Type to search files...';
    if (effectiveMode === 'symbols') return 'Type to search symbols...';
    return 'Type a command...';
  }
</script>

{#if visible}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    class="command-palette-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Command palette"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
  >
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <div class="command-palette" role="document" on:click|stopPropagation>
      <input
        bind:this={inputElement}
        bind:value={searchQuery}
        class="command-palette__input"
        placeholder={getPlaceholder()}
        on:keydown={handleKeyDown}
      />

      <div class="command-palette__results" role="listbox" aria-label="Command palette results">
        {#if currentResultsLength === 0}
          <div class="command-palette__empty">No results found</div>
        {:else if effectiveMode === 'commands'}
          {#each Object.entries(groupedCommands) as [category, commands] (category)}
            <div class="command-category" role="group" aria-label={category}>
              <div class="command-category__title">{category}</div>

              {#each commands as command (command.id)}
                {@const globalIndex = filteredCommands.indexOf(command)}
                <button
                  class="command-item"
                  class:command-item--selected={globalIndex === selectedIndex}
                  role="option"
                  aria-selected={globalIndex === selectedIndex}
                  on:click={() => {
                    selectedIndex = globalIndex;
                    executeSelected();
                  }}
                >
                  <div class="command-item__content">
                    <span class="command-item__label">{command.label}</span>
                    <span class="command-item__id">{command.id}</span>
                  </div>

                  {#if command.keybinding}
                    <div class="command-item__keybinding">
                      {formatShortcut(command.keybinding)}
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        {:else if effectiveMode === 'files'}
          {#each filteredFileResults as item, i (item.type + ':' + item.path)}
            <button
              class="command-item"
              class:command-item--selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
              on:click={() => {
                selectedIndex = i;
                executeSelected();
              }}
            >
              <div class="command-item__content">
                <span class="command-item__label">{item.name}</span>
                <span class="command-item__id">{item.relativePath}</span>
              </div>
            </button>
          {/each}
        {:else}
          {#each filteredSymbolResults as item, i (item.type + ':' + item.name + ':' + item.line)}
            <button
              class="command-item"
              class:command-item--selected={i === selectedIndex}
              role="option"
              aria-selected={i === selectedIndex}
              on:click={() => {
                selectedIndex = i;
                executeSelected();
              }}
            >
              <div class="command-item__content">
                <span class="command-item__label">{item.name}</span>
                <span class="command-item__id">{item.kind} • Ln {item.line}</span>
              </div>
            </button>
          {/each}
        {/if}
      </div>

      <div class="command-palette__footer">
        <span class="command-palette__hint">`>` commands</span>
        <span class="command-palette__hint">`#` files</span>
        <span class="command-palette__hint">`@` symbols</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 20vh;
    z-index: 10000;
  }

  .command-palette {
    width: 680px;
    max-width: 92vw;
    max-height: 64vh;
    background: var(--chrome-bg);
    color: var(--text-primary, #e4e4e4);
    border: 1px solid var(--window-border-color);
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .command-palette__input {
    width: 100%;
    padding: 16px 20px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--window-border-color);
    color: var(--editor-fg);
    font-size: 16px;
    outline: none;
  }

  .command-palette__input::placeholder {
    color: var(--editor-fg);
    opacity: 0.4;
  }

  .command-palette__results {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .command-palette__empty {
    padding: 32px;
    text-align: center;
    color: var(--editor-fg);
    opacity: 0.4;
  }

  .command-category {
    margin-bottom: 12px;
  }

  .command-category__title {
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--editor-fg);
    opacity: 0.6;
  }

  .command-item {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: inherit;
    text-align: left;
    cursor: pointer;
    transition: background var(--transition-hover, 100ms);
  }

  .command-item:hover,
  .command-item--selected {
    background: var(--button-hover);
  }

  .command-item__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .command-item__label {
    font-size: 14px;
  }

  .command-item__id {
    font-size: 11px;
    opacity: 0.5;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .command-item__keybinding {
    font-family: var(--font-mono, 'Courier New', monospace);
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    flex-shrink: 0;
  }

  .command-palette__footer {
    display: flex;
    gap: 16px;
    padding: 8px 20px;
    border-top: 1px solid var(--window-border-color);
    font-size: 11px;
    opacity: 0.6;
  }

  .command-palette__hint {
    display: flex;
    align-items: center;
    gap: 4px;
  }
</style>
