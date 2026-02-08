<!-- src/components/BootScreen.svelte -->
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { pluginsStore } from '$lib/stores/plugins';
  import { get } from 'svelte/store';

  const dispatch = createEventDispatcher<{ complete: void }>();

  // ASCII banner lines (from docs/assets/ascii/templates/banner.txt)
  const banner = [
    ' ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄ ▄▄ ▄▄ ▄▄▄▄   ▄▄▄  ▄▄▄▄',
    '███▄▄ ██▄█▀ ██▄█▄ ██▄▄    ██  ██▀▀▀ ██▄██ ██▄█▀ ██▀██ ██▀██',
    '▄▄██▀ ██ ██ ██ ██ ██▄▄▄   ██  ▀████ ██ ██ ██    ██▀██ ████▀',
  ];

  const VERSION = 'v0.1.0';

  interface BootLine {
    text: string;
    type: 'system' | 'ok' | 'info' | 'plugin' | 'ready';
    delay: number;
  }

  let visibleLines: BootLine[] = [];
  let bannerVisible = false;
  let versionVisible = false;
  let cursorVisible = true;
  let bootComplete = false;

  // Build the boot sequence
  const bootSequence: BootLine[] = [
    { text: 'SKRETCHPAD KERNEL INIT', type: 'system', delay: 100 },
    { text: 'Loading core modules...', type: 'info', delay: 200 },
    { text: 'Theme engine          [OK]', type: 'ok', delay: 150 },
    { text: 'Editor runtime        [OK]', type: 'ok', delay: 120 },
    { text: 'Command palette       [OK]', type: 'ok', delay: 100 },
    { text: 'Plugin sandbox        [OK]', type: 'ok', delay: 180 },
    { text: 'Discovering plugins...', type: 'info', delay: 250 },
  ];

  // Plugin lines will be injected dynamically
  let pluginLines: BootLine[] = [];

  const finalLines: BootLine[] = [
    { text: 'All systems nominal.', type: 'ready', delay: 300 },
  ];

  onMount(async () => {
    // Show banner first
    await sleep(80);
    bannerVisible = true;
    await sleep(200);
    versionVisible = true;
    await sleep(300);

    // Run through boot sequence
    for (const line of bootSequence) {
      await sleep(line.delay);
      visibleLines = [...visibleLines, line];
    }

    // Wait for plugins to initialize (they start in App.svelte's initializeApp)
    // Poll for plugin data with a timeout
    let pluginData = getPluginData();
    const start = Date.now();
    while (pluginData.length === 0 && Date.now() - start < 1500) {
      await sleep(100);
      pluginData = getPluginData();
    }

    // Build plugin lines from discovered data
    if (pluginData.length > 0) {
      pluginLines = pluginData.map(p => ({
        text: `  ${p.name} ${p.version} (${p.trust})  [${p.state === 'active' ? 'ACTIVE' : p.state.toUpperCase()}]`,
        type: 'plugin' as const,
        delay: 120,
      }));
    } else {
      pluginLines = [{ text: '  No plugins discovered.', type: 'info' as const, delay: 120 }];
    }

    // Display plugin lines
    for (const line of pluginLines) {
      await sleep(line.delay);
      visibleLines = [...visibleLines, line];
    }

    // Final lines
    for (const line of finalLines) {
      await sleep(line.delay);
      visibleLines = [...visibleLines, line];
    }

    // Hold for a moment, then fade out
    await sleep(400);
    bootComplete = true;

    // Wait for CSS fade-out transition
    await sleep(500);
    dispatch('complete');
  });

  function getPluginData(): { name: string; version: string; trust: string; state: string }[] {
    const store = get(pluginsStore);
    const plugins: { name: string; version: string; trust: string; state: string }[] = [];
    if (store.plugins && store.plugins.size > 0) {
      for (const p of store.plugins.values()) {
        plugins.push({ name: p.name, version: p.version, trust: 'first-party', state: p.state });
      }
    }
    return plugins;
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cursor blink
  const cursorInterval = setInterval(() => {
    cursorVisible = !cursorVisible;
  }, 530);

  onMount(() => {
    return () => clearInterval(cursorInterval);
  });
</script>

<div class="boot-screen" class:boot-screen--fade-out={bootComplete}>
  <div class="boot-content">
    <!-- ASCII Banner -->
    {#if bannerVisible}
      <div class="banner" class:banner--visible={bannerVisible}>
        {#each banner as line}
          <div class="banner-line">{line}</div>
        {/each}
      </div>
    {/if}

    <!-- Version -->
    {#if versionVisible}
      <div class="version" class:version--visible={versionVisible}>{VERSION}</div>
    {/if}

    <!-- Boot log -->
    <div class="boot-log">
      {#each visibleLines as line}
        <div class="log-line log-line--{line.type}">
          {#if line.type === 'system'}
            <span class="prefix">&gt;</span>
          {:else if line.type === 'ok'}
            <span class="prefix dot">*</span>
          {:else if line.type === 'plugin'}
            <span class="prefix plug">+</span>
          {:else if line.type === 'ready'}
            <span class="prefix ready">#</span>
          {:else}
            <span class="prefix">&nbsp;</span>
          {/if}
          <span class="log-text">{line.text}</span>
        </div>
      {/each}
    </div>

    <!-- Blinking cursor -->
    <div class="cursor-line">
      <span class="cursor" class:cursor--hidden={!cursorVisible}>_</span>
    </div>
  </div>
</div>

<style>
  .boot-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--window-bg, #030304);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 450ms ease-out;
    opacity: 1;
  }

  .boot-screen--fade-out {
    opacity: 0;
    pointer-events: none;
  }

  .boot-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 620px;
    width: 100%;
    padding: 32px;
    gap: 0;
  }

  /* Banner */
  .banner {
    opacity: 0;
    transform: translateY(-4px);
    transition: opacity 300ms ease-out, transform 300ms ease-out;
    margin-bottom: 4px;
  }

  .banner--visible {
    opacity: 1;
    transform: translateY(0);
  }

  .banner-line {
    font-family: var(--font-mono, 'Consolas', 'Courier New', monospace);
    font-size: 13px;
    line-height: 1.3;
    color: var(--palette-cyan, #75FFCF);
    white-space: pre;
    letter-spacing: 0.5px;
  }

  /* Version */
  .version {
    font-family: var(--font-mono, 'Consolas', 'Courier New', monospace);
    font-size: 11px;
    color: var(--palette-brightBlack, #636E83);
    margin-bottom: 16px;
    padding-left: 2px;
    opacity: 0;
    transition: opacity 200ms ease-out;
  }

  .version--visible {
    opacity: 1;
  }

  /* Boot log */
  .boot-log {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
  }

  .log-line {
    font-family: var(--font-mono, 'Consolas', 'Courier New', monospace);
    font-size: 12px;
    line-height: 1.6;
    display: flex;
    gap: 8px;
    animation: lineAppear 120ms ease-out;
  }

  @keyframes lineAppear {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .prefix {
    color: var(--palette-brightBlack, #636E83);
    width: 12px;
    flex-shrink: 0;
    text-align: center;
  }

  .prefix.dot {
    color: var(--palette-green, #E6FF75);
  }

  .prefix.plug {
    color: var(--palette-purple, #FF75C6);
  }

  .prefix.ready {
    color: var(--palette-cyan, #75FFCF);
  }

  .log-text {
    color: var(--palette-foreground, #FFFFFF);
  }

  /* Line type colors */
  .log-line--system .log-text {
    color: var(--palette-yellow, #FBD58E);
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-size: 11px;
  }

  .log-line--ok .log-text {
    color: var(--palette-brightWhite, #E5E5E5);
  }

  .log-line--info .log-text {
    color: var(--palette-brightBlack, #636E83);
  }

  .log-line--plugin .log-text {
    color: var(--palette-white, #FFCCD5);
  }

  .log-line--ready .log-text {
    color: var(--palette-cyan, #75FFCF);
    font-weight: 600;
  }

  /* Cursor */
  .cursor-line {
    margin-top: 4px;
    padding-left: 20px;
    height: 18px;
  }

  .cursor {
    font-family: var(--font-mono, 'Consolas', 'Courier New', monospace);
    font-size: 14px;
    color: var(--palette-cursor, #FFCCD5);
    transition: opacity 80ms;
  }

  .cursor--hidden {
    opacity: 0;
  }
</style>
