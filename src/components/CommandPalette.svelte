<!-- src/lib/components/CommandPalette.svelte -->

<script lang="ts">
    import { commandsByCategory } from '$lib/stores/plugins';
    import { formatShortcut } from '$lib/utils/ui';
    import { createEventDispatcher } from 'svelte';
  
    export let visible = false;
  
    const dispatch = createEventDispatcher();
  
    let searchQuery = '';
    let selectedIndex = 0;
    let inputElement: HTMLInputElement;
  
    // Get all commands
    $: allCommands = Array.from($commandsByCategory.entries()).flatMap(
      ([category, commands]) =>
        commands.map((cmd) => ({ ...cmd, category }))
    );
  
    // Filter commands based on search
    $: filteredCommands = allCommands.filter((cmd) => {
      const query = searchQuery.toLowerCase();
      return (
        cmd.label.toLowerCase().includes(query) ||
        cmd.id.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
      );
    });
  
    // Group filtered commands by category
    $: groupedCommands = filteredCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) {
        acc[cmd.category] = [];
      }
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, PaletteCommand[]>);
  
    $: if (visible && inputElement) {
      inputElement.focus();
    }
  
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, filteredCommands.length - 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        executeSelected();
      }
    }
  
    function executeCommand(commandId: string) {
      dispatch('execute', { commandId });
      close();
    }
  
    function executeSelected() {
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex].id);
      }
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
  </script>
  
  {#if visible}
    <div
      class="command-palette-backdrop"
      on:click={handleBackdropClick}
      on:keydown={handleKeyDown}
    >
      <div class="command-palette" on:click|stopPropagation>
        <input
          bind:this={inputElement}
          bind:value={searchQuery}
          class="command-palette__input"
          placeholder="Type a command..."
          on:keydown={handleKeyDown}
        />
  
        <div class="command-palette__results">
          {#if filteredCommands.length === 0}
            <div class="command-palette__empty">No commands found</div>
          {:else}
            {#each Object.entries(groupedCommands) as [category, commands] (category)}
              <div class="command-category">
                <div class="command-category__title">{category}</div>
  
                {#each commands as command (command.id)}
                  {@const globalIndex = filteredCommands.indexOf(command)}
                  <button
                    class="command-item"
                    class:command-item--selected={globalIndex === selectedIndex}
                    on:click={() => executeCommand(command.id)}
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
          {/if}
        </div>
  
        <div class="command-palette__footer">
          <span class="command-palette__hint">↑↓ navigate</span>
          <span class="command-palette__hint">↵ select</span>
          <span class="command-palette__hint">esc close</span>
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
      width: 600px;
      max-width: 90vw;
      max-height: 60vh;
      background: var(--chrome-bg);
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
    }
  
    .command-item__label {
      font-size: 14px;
    }
  
    .command-item__id {
      font-size: 11px;
      opacity: 0.5;
    }
  
    .command-item__keybinding {
      font-family: var(--font-mono, 'Courier New', monospace);
      font-size: 11px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
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
