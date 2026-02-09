// src/lib/stores/git.ts

import { writable, derived, get } from 'svelte/store';
import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// TYPES
// ============================================================================

export interface GitFileChange {
  path: string;
  old_path?: string;
  status: 'M' | 'A' | 'D' | 'R' | 'C' | 'U';
}

export interface GitStatus {
  is_repo: boolean;
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
  merge_conflicts: string[];
}

export interface GitLogEntry {
  hash: string;
  short_hash: string;
  author: string;
  date: string;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
  upstream?: string;
}

export interface GitStoreState {
  isRepo: boolean;
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
  mergeConflicts: string[];
  commitMessage: string;
  isLoading: boolean;
  error: string | null;
  workdir: string;
}

// ============================================================================
// GIT STORE
// ============================================================================

function createGitStore() {
  const { subscribe, update } = writable<GitStoreState>({
    isRepo: false,
    branch: '',
    upstream: null,
    ahead: 0,
    behind: 0,
    staged: [],
    unstaged: [],
    untracked: [],
    mergeConflicts: [],
    commitMessage: '',
    isLoading: false,
    error: null,
    workdir: '',
  });

  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  return {
    subscribe,

    async initialize(workdir: string): Promise<void> {
      update((s) => ({ ...s, workdir }));
      await this.refresh();

      // Auto-refresh every 3 seconds
      if (refreshInterval) clearInterval(refreshInterval);
      refreshInterval = setInterval(() => {
        const state = get({ subscribe });
        if (state.isRepo) {
          this.refresh();
        }
      }, 3000);
    },

    async refresh(): Promise<void> {
      const state = get({ subscribe });
      if (!state.workdir) return;

      try {
        const status = await invoke<GitStatus>('git_status', {
          workdir: state.workdir,
        });

        update((s) => ({
          ...s,
          isRepo: status.is_repo,
          branch: status.branch,
          upstream: status.upstream,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          unstaged: status.unstaged,
          untracked: status.untracked,
          mergeConflicts: status.merge_conflicts,
          error: null,
        }));
      } catch (err) {
        update((s) => ({
          ...s,
          isRepo: false,
          error: `Git error: ${err}`,
        }));
      }
    },

    async stage(paths: string[]): Promise<void> {
      const state = get({ subscribe });
      try {
        await invoke('git_stage', { workdir: state.workdir, paths });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Stage failed: ${err}` }));
      }
    },

    async unstage(paths: string[]): Promise<void> {
      const state = get({ subscribe });
      try {
        await invoke('git_unstage', { workdir: state.workdir, paths });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Unstage failed: ${err}` }));
      }
    },

    async discardChanges(paths: string[]): Promise<void> {
      const state = get({ subscribe });
      try {
        await invoke('git_discard_changes', { workdir: state.workdir, paths });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Discard failed: ${err}` }));
      }
    },

    async commit(message: string): Promise<void> {
      const state = get({ subscribe });
      try {
        await invoke('git_commit', { workdir: state.workdir, message });
        update((s) => ({ ...s, commitMessage: '' }));
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Commit failed: ${err}` }));
      }
    },

    async push(): Promise<void> {
      const state = get({ subscribe });
      update((s) => ({ ...s, isLoading: true }));
      try {
        await invoke('git_push', { workdir: state.workdir });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Push failed: ${err}` }));
      } finally {
        update((s) => ({ ...s, isLoading: false }));
      }
    },

    async pull(): Promise<void> {
      const state = get({ subscribe });
      update((s) => ({ ...s, isLoading: true }));
      try {
        await invoke('git_pull', { workdir: state.workdir });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Pull failed: ${err}` }));
      } finally {
        update((s) => ({ ...s, isLoading: false }));
      }
    },

    async fetch(): Promise<void> {
      const state = get({ subscribe });
      try {
        await invoke('git_fetch', { workdir: state.workdir });
        await this.refresh();
      } catch (err) {
        update((s) => ({ ...s, error: `Fetch failed: ${err}` }));
      }
    },

    setCommitMessage(msg: string): void {
      update((s) => ({ ...s, commitMessage: msg }));
    },

    cleanup(): void {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    },
  };
}

export const gitStore = createGitStore();

// ============================================================================
// DERIVED STORES
// ============================================================================

export const stagedCount = derived(gitStore, ($git) => $git.staged.length);
export const unstagedCount = derived(gitStore, ($git) => $git.unstaged.length);
export const untrackedCount = derived(gitStore, ($git) => $git.untracked.length);
export const totalChanges = derived(
  gitStore,
  ($git) => $git.staged.length + $git.unstaged.length + $git.untracked.length
);
export const currentBranch = derived(gitStore, ($git) => $git.branch);
export const syncStatus = derived(gitStore, ($git) => ({
  ahead: $git.ahead,
  behind: $git.behind,
}));
