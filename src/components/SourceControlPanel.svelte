<!-- src/components/SourceControlPanel.svelte -->

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { gitStore, stagedCount, unstagedCount, untrackedCount } from '$lib/stores/git';
  import ChangeItem from './ChangeItem.svelte';
  import { icons } from '../lib/icons/index';

  const dispatch = createEventDispatcher<{
    openDiff: { path: string; staged: boolean };
  }>();

  let stagedOpen = true;
  let unstagedOpen = true;
  let untrackedOpen = true;

  $: canCommit = $stagedCount > 0 && $gitStore.commitMessage.trim().length > 0;

  function handleCommit() {
    if (canCommit) {
      gitStore.commit($gitStore.commitMessage);
    }
  }

  function handleCommitKeydown(e: KeyboardEvent) {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  }

  function handleStageAll() {
    const paths = $gitStore.unstaged.map((c) => c.path);
    if (paths.length > 0) gitStore.stage(paths);
  }

  function handleUnstageAll() {
    const paths = $gitStore.staged.map((c) => c.path);
    if (paths.length > 0) gitStore.unstage(paths);
  }

  function handleStageAllUntracked() {
    if ($gitStore.untracked.length > 0) gitStore.stage($gitStore.untracked);
  }

  function handleFileClick(e: CustomEvent<{ path: string; staged: boolean }>) {
    dispatch('openDiff', e.detail);
  }
</script>

<div class="scm-panel">
  {#if !$gitStore.isRepo}
    <div class="scm-empty">
      <p>Not a git repository</p>
    </div>
  {:else}
    <!-- Commit area -->
    <div class="scm-commit">
      <textarea
        class="scm-commit__input"
        placeholder="Commit message (Ctrl+Enter to commit)"
        bind:value={$gitStore.commitMessage}
        on:input={(e) => gitStore.setCommitMessage(e.currentTarget.value)}
        on:keydown={handleCommitKeydown}
        rows="3"
      ></textarea>
      <button
        class="scm-commit__button"
        disabled={!canCommit}
        on:click={handleCommit}
        title={!canCommit ? 'Stage changes and enter a message' : 'Commit staged changes'}
      >
        {@html icons.checkmark}
        Commit
      </button>
    </div>

    <!-- Action bar -->
    <div class="scm-actions">
      {#if $gitStore.upstream}
        <button
          class="scm-actions__btn"
          title="Push"
          disabled={$gitStore.isLoading}
          on:click={() => gitStore.push()}
        >
          {#if $gitStore.ahead > 0}
            <span class="scm-actions__count">{$gitStore.ahead}</span>
          {/if}
        </button>
        <button
          class="scm-actions__btn"
          title="Pull"
          disabled={$gitStore.isLoading}
          on:click={() => gitStore.pull()}
        >
          {#if $gitStore.behind > 0}
            <span class="scm-actions__count">{$gitStore.behind}</span>
          {/if}
        </button>
      {/if}
      <button
        class="scm-actions__btn"
        title="Fetch"
        disabled={$gitStore.isLoading}
        on:click={() => gitStore.fetch()}
      >
        {@html icons.sync}
      </button>
      <button class="scm-actions__btn" title="Refresh" on:click={() => gitStore.refresh()}>
        Refresh
      </button>
    </div>

    <!-- Error display -->
    {#if $gitStore.error}
      <div class="scm-error">{$gitStore.error}</div>
    {/if}

    <!-- Staged Changes -->
    {#if $stagedCount > 0}
      <div class="scm-section">
        <button
          class="scm-section__header"
          on:click={() => (stagedOpen = !stagedOpen)}
          aria-expanded={stagedOpen}
        >
          <span class="scm-section__chevron" class:scm-section__chevron--open={stagedOpen}>
            {@html icons.chevronDown}
          </span>
          <span class="scm-section__title">Staged Changes</span>
          <span class="scm-section__count">{$stagedCount}</span>
          <button
            class="scm-section__action"
            title="Unstage All"
            on:click|stopPropagation={handleUnstageAll}
          >
            {@html icons.minus}
          </button>
        </button>
        {#if stagedOpen}
          <div class="scm-section__list">
            {#each $gitStore.staged as change (change.path + '-staged')}
              <ChangeItem
                {change}
                staged={true}
                on:click={handleFileClick}
                on:unstage={(e) => gitStore.unstage([e.detail.path])}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Changes (unstaged) -->
    {#if $unstagedCount > 0}
      <div class="scm-section">
        <button
          class="scm-section__header"
          on:click={() => (unstagedOpen = !unstagedOpen)}
          aria-expanded={unstagedOpen}
        >
          <span class="scm-section__chevron" class:scm-section__chevron--open={unstagedOpen}>
            {@html icons.chevronDown}
          </span>
          <span class="scm-section__title">Changes</span>
          <span class="scm-section__count">{$unstagedCount}</span>
          <button
            class="scm-section__action"
            title="Stage All"
            on:click|stopPropagation={handleStageAll}
          >
            {@html icons.plus}
          </button>
        </button>
        {#if unstagedOpen}
          <div class="scm-section__list">
            {#each $gitStore.unstaged as change (change.path + '-unstaged')}
              <ChangeItem
                {change}
                staged={false}
                on:click={handleFileClick}
                on:stage={(e) => gitStore.stage([e.detail.path])}
                on:discard={(e) => gitStore.discardChanges([e.detail.path])}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Untracked -->
    {#if $untrackedCount > 0}
      <div class="scm-section">
        <button
          class="scm-section__header"
          on:click={() => (untrackedOpen = !untrackedOpen)}
          aria-expanded={untrackedOpen}
        >
          <span class="scm-section__chevron" class:scm-section__chevron--open={untrackedOpen}>
            {@html icons.chevronDown}
          </span>
          <span class="scm-section__title">Untracked</span>
          <span class="scm-section__count">{$untrackedCount}</span>
          <button
            class="scm-section__action"
            title="Stage All"
            on:click|stopPropagation={handleStageAllUntracked}
          >
            {@html icons.plus}
          </button>
        </button>
        {#if untrackedOpen}
          <div class="scm-section__list">
            {#each $gitStore.untracked as path (path)}
              <div
                class="change-item-untracked"
                role="button"
                tabindex="0"
                on:click={() => gitStore.stage([path])}
                on:keydown={(e) => e.key === 'Enter' && gitStore.stage([path])}
              >
                <span class="change-item-untracked__badge">?</span>
                <span class="change-item-untracked__name">{path.split(/[/\\]/).pop()}</span>
                <span class="change-item-untracked__dir">
                  {path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : ''}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Empty state -->
    {#if $stagedCount === 0 && $unstagedCount === 0 && $untrackedCount === 0}
      <div class="scm-empty">
        <p>No changes</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .scm-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: auto;
  }

  .scm-commit {
    padding: 8px;
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
  }

  .scm-commit__input {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--input-border, rgba(255, 255, 255, 0.15));
    border-radius: 4px;
    color: inherit;
    font-size: 12px;
    font-family: var(--font-mono, monospace);
    padding: 6px 8px;
    resize: vertical;
    min-height: 36px;
    box-sizing: border-box;
  }

  .scm-commit__input:focus {
    outline: none;
    border-color: var(--color-info, #00d9ff);
  }

  .scm-commit__input::placeholder {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
  }

  .scm-commit__button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    margin-top: 6px;
    padding: 5px 12px;
    background: var(--color-info, #00d9ff);
    color: #000;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 150ms ease;
  }

  .scm-commit__button :global(svg) {
    width: 12px;
    height: 12px;
  }

  .scm-commit__button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .scm-commit__button:not(:disabled):hover {
    opacity: 0.9;
  }

  .scm-actions {
    display: flex;
    gap: 4px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.1));
    flex-shrink: 0;
  }

  .scm-actions__btn {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 3px 8px;
    background: transparent;
    border: 1px solid var(--input-border, rgba(255, 255, 255, 0.15));
    border-radius: 4px;
    color: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: background 100ms ease;
  }

  .scm-actions__btn :global(svg) {
    width: 12px;
    height: 12px;
  }

  .scm-actions__btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
  }

  .scm-actions__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .scm-actions__count {
    font-weight: 700;
    color: var(--color-info, #00d9ff);
  }

  .scm-error {
    padding: 6px 8px;
    font-size: 11px;
    color: var(--color-error, #ff6b6b);
    background: rgba(255, 107, 107, 0.1);
    border-bottom: 1px solid var(--window-border-color);
  }

  .scm-section {
    border-bottom: 1px solid var(--window-border-color, rgba(255, 255, 255, 0.06));
  }

  .scm-section__header {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 8px;
    background: transparent;
    border: none;
    color: inherit;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background 100ms ease;
  }

  .scm-section__header:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .scm-section__chevron {
    display: flex;
    transition: transform 150ms ease;
  }

  .scm-section__chevron :global(svg) {
    width: 12px;
    height: 12px;
  }

  .scm-section__chevron:not(.scm-section__chevron--open) {
    transform: rotate(-90deg);
  }

  .scm-section__title {
    flex: 1;
    text-align: left;
  }

  .scm-section__count {
    background: rgba(255, 255, 255, 0.1);
    padding: 0 6px;
    border-radius: 8px;
    font-size: 10px;
    min-width: 16px;
    text-align: center;
  }

  .scm-section__action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 3px;
    color: inherit;
    cursor: pointer;
    opacity: 0;
    transition:
      opacity 100ms ease,
      background 100ms ease;
  }

  .scm-section__action :global(svg) {
    width: 12px;
    height: 12px;
  }

  .scm-section__header:hover .scm-section__action {
    opacity: 0.7;
  }

  .scm-section__action:hover {
    opacity: 1 !important;
    background: rgba(255, 255, 255, 0.1);
  }

  .scm-section__list {
    padding: 2px 0;
  }

  .scm-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 80px;
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-size: 12px;
  }

  .change-item-untracked {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 12px;
    transition: background 100ms ease;
  }

  .change-item-untracked:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .change-item-untracked__badge {
    font-weight: 700;
    font-size: 11px;
    font-family: var(--font-mono, monospace);
    width: 14px;
    text-align: center;
    color: var(--color-success, #51cf66);
    flex-shrink: 0;
  }

  .change-item-untracked__name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .change-item-untracked__dir {
    color: var(--text-secondary, rgba(228, 228, 228, 0.4));
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
</style>
