<script lang="ts">
  import { icons } from '../lib/icons/index';
  import { getCurrentWindow } from '@tauri-apps/api/window';

  export let alwaysOnTop = false;
  export let visible = true;
  export let onToggleChrome: () => void;
  export let onTogglePin: () => void;

  let isMaximized = false;

  // Check initial maximized state
  getCurrentWindow().isMaximized().then(v => isMaximized = v).catch(() => {});

  async function handleMinimize() {
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error('Failed to minimize:', e);
    }
  }

  async function handleMaximize() {
    try {
      await getCurrentWindow().toggleMaximize();
      isMaximized = await getCurrentWindow().isMaximized();
    } catch (e) {
      console.error('Failed to toggle maximize:', e);
    }
  }

  async function handleClose() {
    try {
      await getCurrentWindow().close();
    } catch (e) {
      console.error('Failed to close:', e);
    }
  }

  function handleToggleChrome() {
    onToggleChrome();
  }

  function handleTogglePin() {
    onTogglePin();
  }
</script>

<div class="chrome" class:chrome--hidden={!visible}>
  <div class="title-bar" data-tauri-drag-region>
    <div class="window-controls">
      <button
        class="control-button close"
        on:click={handleClose}
        aria-label="Close window"
        title="Close"
      >
        {@html icons.close}
      </button>
      <button
        class="control-button minimize"
        on:click={handleMinimize}
        aria-label="Minimize window"
        title="Minimize"
      >
        {@html icons.minimize}
      </button>
      <button
        class="control-button maximize"
        on:click={handleMaximize}
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        {@html isMaximized ? icons.restore : icons.maximize}
      </button>
    </div>

    <div class="title">skretchpad</div>

    <div class="chrome-actions">
      <button
        class="action-button"
        class:pinned={alwaysOnTop}
        on:click={handleTogglePin}
        aria-label={alwaysOnTop ? 'Unpin from top' : 'Pin to top'}
        title="Toggle Always on Top"
      >
        {@html icons.pin}
      </button>
      <button
        class="action-button"
        on:click={handleToggleChrome}
        aria-label="Toggle title bar (Ctrl+Shift+H)"
        title="Toggle Chrome (Ctrl+Shift+H)"
      >
        {@html icons.eye}
      </button>
    </div>
  </div>
</div>

<style>
  .chrome {
    background: rgba(28, 28, 28, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    height: 32px;
    display: flex;
    align-items: center;
    user-select: none;
    transition: height 200ms ease-out, opacity 200ms ease-out;
    overflow: hidden;
    flex-shrink: 0;
  }

  .chrome--hidden {
    height: 0;
    opacity: 0;
    border-bottom: none;
  }

  .title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0 12px;
  }

  .window-controls {
    display: flex;
    gap: 8px;
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
    color: transparent;
    transition: color 150ms ease;
  }

  .control-button :global(svg) {
    width: 8px;
    height: 8px;
  }

  .window-controls:hover .control-button {
    color: rgba(0, 0, 0, 0.6);
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

  .title {
    color: rgba(228, 228, 228, 0.9);
    font-size: 13px;
    font-weight: 500;
    flex: 1;
    text-align: center;
    pointer-events: none;
  }

  .chrome-actions {
    display: flex;
    gap: 8px;
  }

  .action-button {
    background: transparent;
    border: none;
    color: rgba(228, 228, 228, 0.7);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-button :global(svg) {
    width: 14px;
    height: 14px;
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(228, 228, 228, 1);
  }

  .action-button.pinned {
    color: #00d9ff;
  }
</style>
