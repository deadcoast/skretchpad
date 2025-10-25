<script lang="ts">
  export let alwaysOnTop = false;
  export let onToggleChrome: () => void;
  export let onTogglePin: () => void;

  function handleToggleChrome() {
    onToggleChrome();
  }

  function handleTogglePin() {
    onTogglePin();
  }
</script>

<div class="chrome">
  <div class="title-bar">
    <div class="window-controls">
      <button class="control-button minimize">−</button>
      <button class="control-button maximize">□</button>
      <button class="control-button close">×</button>
    </div>
    
    <div class="title">skretchpad</div>
    
    <div class="chrome-actions">
      <button 
        class="action-button" 
        class:pinned={alwaysOnTop}
        on:click={handleTogglePin}
        title="Toggle Always on Top"
      >
        📌
      </button>
      <button 
        class="action-button" 
        on:click={handleToggleChrome}
        title="Toggle Chrome (Ctrl+Shift+H)"
      >
        👁
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
    font-size: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
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
  }

  .action-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(228, 228, 228, 1);
  }

  .action-button.pinned {
    color: #00d9ff;
  }
</style>
