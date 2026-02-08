<!-- src/components/SettingsPanel.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { themeStore } from '../lib/stores/theme';
  import { keybindingStore } from '../lib/stores/keybindings';
  import { settingsStore } from '../lib/stores/settings';
  import { icons } from '../lib/icons/index';

  export let visible: boolean = false;

  const dispatch = createEventDispatcher<{ close: void }>();

  // Bind to settings store
  $: fontSize = $settingsStore.appearance.fontSize;
  $: fontFamily = $settingsStore.appearance.fontFamily;
  $: tabSize = $settingsStore.editor.tabSize;
  $: wordWrap = $settingsStore.editor.wordWrap;
  $: lineNumbers = $settingsStore.editor.lineNumbers;
  $: minimap = $settingsStore.editor.minimap;
  $: autoSave = $settingsStore.files.autoSave;
  $: autoSaveDelay = $settingsStore.files.autoSaveDelay;

  // Apply editor CSS settings reactively
  $: if (visible) {
    applyEditorSettings();
  }

  function applyEditorSettings() {
    const root = document.documentElement;
    root.style.setProperty('--editor-font-size', `${fontSize}px`);
    root.style.setProperty('--editor-font-family', fontFamily);
    root.style.setProperty('--editor-tab-size', `${tabSize}`);
  }

  function handleFontSizeChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    settingsStore.update('appearance', { fontSize: val });
  }

  function handleFontFamilyChange(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    settingsStore.update('appearance', { fontFamily: val });
  }

  function handleTabSizeChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    settingsStore.update('editor', { tabSize: val });
  }

  function handleWordWrapChange() {
    settingsStore.update('editor', { wordWrap: !wordWrap });
  }

  function handleLineNumbersChange() {
    settingsStore.update('editor', { lineNumbers: !lineNumbers });
  }

  function handleMinimapChange() {
    settingsStore.update('editor', { minimap: !minimap });
  }

  function handleAutoSaveChange() {
    settingsStore.update('files', { autoSave: !autoSave });
  }

  function handleAutoSaveDelayChange(e: Event) {
    const val = Number((e.target as HTMLSelectElement).value);
    settingsStore.update('files', { autoSaveDelay: val });
  }

  function handleThemeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const name = select.value;
    settingsStore.update('appearance', { theme: name });
    if (name === 'glass-dark') {
      themeStore.resetToDefault();
    } else {
      themeStore.switchTheme(name);
    }
  }

  function handleKeybindingChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const name = select.value;
    settingsStore.update('keybindings', { scheme: name });
    const scheme = $keybindingStore.available.find(s => s.name === name);
    if (scheme) {
      keybindingStore.setScheme(scheme);
    }
  }

  function handleClose() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      handleClose();
    }
  }

  // Font size presets
  const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24];
  const tabSizes = [2, 4, 8];
  const fontFamilies = [
    { label: 'System Default', value: "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace" },
    { label: 'Fira Code', value: "'Fira Code', monospace" },
    { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
    { label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
    { label: 'Consolas', value: "'Consolas', monospace" },
    { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  ];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if visible}
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div class="settings-backdrop" on:click={handleClose} on:keydown={handleKeydown} role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
    <div class="settings-panel" on:click|stopPropagation on:keydown|stopPropagation role="document">
      <div class="settings-header">
        <h2 id="settings-title">Settings</h2>
        <button class="settings-close" on:click={handleClose} title="Close" aria-label="Close settings">{@html icons.close}</button>
      </div>

      <div class="settings-body">
        <!-- Appearance Section -->
        <section class="settings-section">
          <h3 class="section-title">Appearance</h3>

          <div class="setting-row">
            <label for="theme-select">Theme</label>
            <select
              id="theme-select"
              value={$themeStore.current?.metadata?.name || 'Liquid Glass Dark'}
              on:change={handleThemeChange}
            >
              {#each $themeStore.available as theme}
                <option value={theme.metadata.name}>{theme.metadata.name}</option>
              {/each}
              {#if $themeStore.available.length === 0}
                <option value="glass-dark">Liquid Glass Dark</option>
                <option value="glass-light">Liquid Glass Light</option>
              {/if}
            </select>
          </div>

          <div class="setting-row">
            <label for="font-size">Font Size</label>
            <select id="font-size" value={fontSize} on:change={handleFontSizeChange}>
              {#each fontSizes as size}
                <option value={size}>{size}px</option>
              {/each}
            </select>
          </div>

          <div class="setting-row">
            <label for="font-family">Font Family</label>
            <select id="font-family" value={fontFamily} on:change={handleFontFamilyChange}>
              {#each fontFamilies as font}
                <option value={font.value}>{font.label}</option>
              {/each}
            </select>
          </div>
        </section>

        <!-- Editor Section -->
        <section class="settings-section">
          <h3 class="section-title">Editor</h3>

          <div class="setting-row">
            <label for="tab-size">Tab Size</label>
            <select id="tab-size" value={tabSize} on:change={handleTabSizeChange}>
              {#each tabSizes as size}
                <option value={size}>{size} spaces</option>
              {/each}
            </select>
          </div>

          <div class="setting-row">
            <label for="word-wrap-toggle">Word Wrap</label>
            <label class="toggle">
              <input type="checkbox" checked={wordWrap} on:change={handleWordWrapChange} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <label for="line-numbers-toggle">Line Numbers</label>
            <label class="toggle">
              <input type="checkbox" checked={lineNumbers} on:change={handleLineNumbersChange} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="setting-row">
            <label for="minimap-toggle">Minimap</label>
            <label class="toggle">
              <input type="checkbox" checked={minimap} on:change={handleMinimapChange} />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </section>

        <!-- Keybindings Section -->
        <section class="settings-section">
          <h3 class="section-title">Keybindings</h3>

          <div class="setting-row">
            <label for="keybinding-scheme">Keybinding Scheme</label>
            <select
              id="keybinding-scheme"
              value={$keybindingStore.currentScheme?.name || 'Default'}
              on:change={handleKeybindingChange}
            >
              {#each $keybindingStore.available as scheme}
                <option value={scheme.name}>{scheme.name}</option>
              {/each}
            </select>
          </div>
        </section>

        <!-- Auto-save Section -->
        <section class="settings-section">
          <h3 class="section-title">Files</h3>

          <div class="setting-row">
            <label for="auto-save-toggle">Auto Save</label>
            <label class="toggle">
              <input type="checkbox" checked={autoSave} on:change={handleAutoSaveChange} />
              <span class="toggle-slider"></span>
            </label>
          </div>

          {#if autoSave}
            <div class="setting-row">
              <label for="auto-save-delay">Auto Save Delay</label>
              <select id="auto-save-delay" value={autoSaveDelay} on:change={handleAutoSaveDelayChange}>
                <option value={500}>500ms</option>
                <option value={1000}>1 second</option>
                <option value={2000}>2 seconds</option>
                <option value={5000}>5 seconds</option>
              </select>
            </div>
          {/if}
        </section>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 150ms ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .settings-panel {
    width: 520px;
    max-height: 80vh;
    background: var(--chrome-bg, rgba(30, 30, 30, 0.95));
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideUp 200ms ease-out;
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
  }

  .settings-header h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary, #e4e4e4);
  }

  .settings-close {
    background: transparent;
    border: none;
    color: var(--text-secondary, rgba(228, 228, 228, 0.6));
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 150ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .settings-close :global(svg) {
    width: 16px;
    height: 16px;
  }

  .settings-close:hover {
    color: var(--text-primary, #e4e4e4);
    background: rgba(255, 255, 255, 0.1);
  }

  .settings-body {
    overflow-y: auto;
    padding: 8px 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .settings-section {
    padding: 12px 20px;
  }

  .settings-section + .settings-section {
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.5));
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    min-height: 32px;
  }

  .setting-row label:first-child {
    font-size: 13px;
    color: var(--text-primary, #e4e4e4);
  }

  .setting-row select {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
    border-radius: 6px;
    color: var(--text-primary, #e4e4e4);
    font-size: 13px;
    padding: 4px 8px;
    min-width: 160px;
    cursor: pointer;
    transition: border-color 150ms ease;
  }

  .setting-row select:hover {
    border-color: var(--color-primary, #00d9ff);
  }

  .setting-row select:focus {
    outline: none;
    border-color: var(--color-primary, #00d9ff);
    box-shadow: 0 0 0 2px rgba(0, 217, 255, 0.15);
  }

  .setting-row select option {
    background: #2d2d2d;
    color: #e4e4e4;
  }

  /* Toggle switch */
  .toggle {
    position: relative;
    display: inline-block;
    width: 36px;
    height: 20px;
    cursor: pointer;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    transition: all 200ms ease;
  }

  .toggle-slider::before {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    left: 2px;
    bottom: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 200ms ease;
  }

  .toggle input:checked + .toggle-slider {
    background: var(--color-primary, #00d9ff);
  }

  .toggle input:checked + .toggle-slider::before {
    transform: translateX(16px);
  }
</style>
