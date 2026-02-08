<script lang="ts">
  import { icons } from '../lib/icons/index';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { createEventDispatcher } from 'svelte';

  export let alwaysOnTop = false;
  export let menuVisible = true;

  const dispatch = createEventDispatcher<{
    command: { commandId: string };
    togglePin: void;
    toggleMenu: void;
  }>();

  let isMaximized = false;
  let openMenu: string | null = null;

  getCurrentWindow()
    .isMaximized()
    .then((v) => (isMaximized = v))
    .catch(() => {});

  // Window control handlers
  async function handleMinimize() {
    await getCurrentWindow()
      .minimize()
      .catch((e) => console.error('minimize:', e));
  }

  async function handleMaximize() {
    await getCurrentWindow()
      .toggleMaximize()
      .catch((e) => console.error('maximize:', e));
    isMaximized = await getCurrentWindow()
      .isMaximized()
      .catch(() => false);
  }

  async function handleClose() {
    await getCurrentWindow()
      .close()
      .catch((e) => console.error('close:', e));
  }

  // Drag the window when mousedown on the title area
  function handleTitleMouseDown(e: MouseEvent) {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('.menu-item')
    )
      return;
    getCurrentWindow()
      .startDragging()
      .catch(() => {});
  }

  // Double-click title to maximize/restore
  function handleTitleDblClick() {
    handleMaximize();
  }

  // Menu definitions
  const menus: Record<
    string,
    { label: string; id: string; shortcut?: string; separator?: boolean }[]
  > = {
    File: [
      { label: 'New File', id: 'file.new', shortcut: 'Ctrl+N' },
      { label: 'Open File...', id: 'file.open', shortcut: 'Ctrl+O' },
      { label: '', id: '', separator: true },
      { label: 'Save', id: 'file.save', shortcut: 'Ctrl+S' },
      { label: 'Save As...', id: 'file.saveAs', shortcut: 'Ctrl+Shift+S' },
      { label: '', id: '', separator: true },
      { label: 'Close File', id: 'file.close', shortcut: 'Ctrl+W' },
    ],
    Edit: [
      { label: 'Undo', id: 'editor.undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', id: 'editor.redo', shortcut: 'Ctrl+Shift+Z' },
      { label: '', id: '', separator: true },
      { label: 'Find', id: 'editor.find', shortcut: 'Ctrl+F' },
      { label: 'Format Document', id: 'editor.formatDocument', shortcut: 'Ctrl+Shift+F' },
      { label: '', id: '', separator: true },
      { label: 'Toggle Comment', id: 'editor.toggleComment', shortcut: 'Ctrl+/' },
      { label: 'Duplicate Line', id: 'editor.duplicateLine', shortcut: 'Ctrl+Shift+D' },
      { label: 'Delete Line', id: 'editor.deleteLine', shortcut: 'Ctrl+Shift+K' },
    ],
    View: [
      { label: 'Command Palette', id: 'view.commandPalette', shortcut: 'Ctrl+Shift+P' },
      { label: '', id: '', separator: true },
      { label: 'Settings', id: 'view.openSettings', shortcut: 'Ctrl+,' },
      { label: 'Toggle Sidebar', id: 'view.toggleSidebar', shortcut: 'Ctrl+B' },
      { label: 'Diff View', id: 'view.openDiffView' },
      { label: '', id: '', separator: true },
      { label: 'Always on Top', id: 'view.toggleAlwaysOnTop' },
    ],
  };

  function toggleMenu(name: string) {
    openMenu = openMenu === name ? null : name;
  }

  function handleMenuItemClick(id: string) {
    openMenu = null;
    dispatch('command', { commandId: id });
  }

  function handleMenuEnter(name: string) {
    if (openMenu && openMenu !== name) {
      openMenu = name;
    }
  }

  function closeMenus() {
    openMenu = null;
  }

  function handleMenuKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeMenus();
    }
  }
</script>

<svelte:window on:keydown={handleMenuKeydown} />

{#if openMenu}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="menu-backdrop" on:click={closeMenus}></div>
{/if}

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="chrome"
  class:chrome--minimal={!menuVisible}
  on:mousedown={handleTitleMouseDown}
  on:dblclick={handleTitleDblClick}
>
  <div class="title-bar">
    <!-- Action buttons (left side, always visible) -->
    <div class="chrome-actions chrome-actions--persistent">
      <button
        class="action-button"
        class:pinned={alwaysOnTop}
        on:click|stopPropagation={() => dispatch('togglePin')}
        title="Always on Top"
      >
        {@html icons.pin}
      </button>
      <button
        class="action-button"
        on:click|stopPropagation={() => dispatch('toggleMenu')}
        title="Toggle Menu"
      >
        {@html menuVisible ? icons.eye : icons.eyeOff}
      </button>
    </div>

    <!-- Menu bar (hidden in minimal mode) -->
    {#if menuVisible}
      <div class="menu-bar" role="menubar">
        {#each Object.entries(menus) as [name, items]}
          <div class="menu-item-wrapper">
            <button
              class="menu-trigger"
              class:menu-trigger--active={openMenu === name}
              on:click|stopPropagation={() => toggleMenu(name)}
              on:mouseenter={() => handleMenuEnter(name)}
              aria-haspopup="true"
              aria-expanded={openMenu === name}
            >
              {name}
            </button>

            {#if openMenu === name}
              <div class="menu-dropdown" role="menu">
                {#each items as item}
                  {#if item.separator}
                    <div class="menu-separator"></div>
                  {:else}
                    <button
                      class="menu-dropdown-item"
                      role="menuitem"
                      on:click|stopPropagation={() => handleMenuItemClick(item.id)}
                    >
                      <span class="menu-dropdown-label">{item.label}</span>
                      {#if item.shortcut}
                        <span class="menu-dropdown-shortcut">{item.shortcut}</span>
                      {/if}
                    </button>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Spacer (drag region) -->
    <div class="title-spacer"></div>

    <!-- Window controls (right side, hidden in minimal mode) -->
    {#if menuVisible}
      <div class="window-controls">
        <button
          class="control-button minimize"
          on:click={handleMinimize}
          title="Minimize"
          aria-label="Minimize window"
        >
          {@html icons.minimize}
        </button>
        <button
          class="control-button maximize"
          on:click={handleMaximize}
          title={isMaximized ? 'Restore' : 'Maximize'}
          aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        >
          {@html isMaximized ? icons.restore : icons.maximize}
        </button>
        <button
          class="control-button close"
          on:click={handleClose}
          title="Close"
          aria-label="Close window"
        >
          {@html icons.close}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .chrome {
    background: var(--chrome-bg);
    backdrop-filter: blur(var(--chrome-blur, 10px));
    border-bottom: 1px solid var(--chrome-border, var(--border-subtle));
    height: var(--chrome-height, 32px);
    display: flex;
    align-items: center;
    user-select: none;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
    transition:
      background 200ms ease,
      border-color 200ms ease;
  }

  .chrome--minimal {
    background: transparent;
    backdrop-filter: none;
    border-bottom-color: transparent;
  }

  .title-bar {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0 12px;
    height: 100%;
  }

  /* Window controls */
  .window-controls {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .control-button {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: rgba(0, 0, 0, 0.4);
    transition: color 150ms ease;
  }

  .control-button :global(svg) {
    width: 8px;
    height: 8px;
  }

  .window-controls:hover .control-button {
    color: rgba(0, 0, 0, 0.8);
  }

  .minimize {
    background: #ffbd2e;
  }
  .maximize {
    background: #27ca3f;
  }
  .close {
    background: #ff5f56;
  }

  /* Menu bar */
  .menu-bar {
    display: flex;
    margin-left: 16px;
    flex-shrink: 0;
  }

  .menu-item-wrapper {
    position: relative;
  }

  .menu-trigger {
    background: transparent;
    border: none;
    color: var(--chrome-menu-fg, var(--chrome-fg));
    opacity: 0.7;
    font-size: 12px;
    padding: 4px 10px;
    cursor: pointer;
    border-radius: 4px;
    transition: all var(--transition-hover, 100ms) var(--transition-easing);
  }

  .menu-trigger:hover,
  .menu-trigger--active {
    background: var(--button-hover);
    opacity: 1;
  }

  /* Dropdown */
  .menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .menu-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 2px;
    min-width: 220px;
    background: var(--chrome-menu-bg, var(--chrome-bg));
    backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    z-index: 200;
  }

  .menu-dropdown-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 6px 12px;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--chrome-menu-fg, var(--text-primary));
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    transition: background 80ms ease;
  }

  .menu-dropdown-item:hover {
    background: var(--chrome-menu-hover, var(--button-hover));
    color: var(--text-primary);
  }

  .menu-dropdown-label {
    flex: 1;
  }

  .menu-dropdown-shortcut {
    color: var(--text-disabled);
    font-size: 11px;
    margin-left: 24px;
    font-family: var(--font-mono, 'Consolas', monospace);
  }

  .menu-separator {
    height: 1px;
    background: var(--border-subtle);
    margin: 4px 8px;
  }

  /* Spacer / drag region */
  .title-spacer {
    flex: 1;
  }

  /* Action buttons */
  .chrome-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .action-button {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all var(--transition-hover, 150ms) var(--transition-easing);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button :global(svg) {
    width: 14px;
    height: 14px;
  }

  .action-button:hover {
    background: var(--button-hover);
    color: var(--text-primary);
  }

  .action-button.pinned {
    color: var(--color-primary);
  }

  /* Minimal mode: persistent buttons fade to subtle */
  .chrome--minimal .chrome-actions--persistent .action-button {
    opacity: 0.35;
    transition: opacity 200ms ease;
  }

  .chrome--minimal .chrome-actions--persistent .action-button:hover {
    opacity: 1;
  }

  .chrome--minimal .chrome-actions--persistent .action-button.pinned {
    opacity: 0.6;
  }
</style>
