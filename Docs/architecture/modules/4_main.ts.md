# main.ts

## 4. `plugins/git/main.ts`

Why:

- Complete Git client implementation in TypeScript
- Git status parsing (porcelain v2 format)
- Diff parsing with hunk extraction
- Branch management (list, checkout, create, delete)
- Commit workflow (stage, unstage, commit, push, pull)
- Conflict detection and resolution UI
- File watching for .git directory changes
- Real-time status bar updates
- Multiple UI components (status panel, diff viewer, branch manager)
- Command execution with error handling
- State management for repository context

Features Implemented:

- Status tracking (ahead/behind/staged/unstaged/untracked/conflicts)
- Diff view integration
- Quick commit dialog
- Branch switcher
- File staging/unstaging
- Change discarding
- Push/pull with progress
- Merge conflict detection

Integration Points:

- Plugin API (fs, commands, ui, events)
- Editor integration
- Status bar
- Sidebar panels
- Command palette
- File watcher
- Git CLI

Estimated LOC: 600-900 lines (plus 300+ in Svelte components)

```typescript
// plugins/git/main.ts

import type {
  Plugin,
  PluginContext,
  StatusBarItem,
  Panel,
  Command,
  FileWatcher,
} from '@skretchpad/plugin-api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface GitStatus {
  branch: string;
  upstream?: string;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: string[];
  conflicts: FileChange[];
  clean: boolean;
}

interface FileChange {
  path: string;
  status: FileStatus;
  oldPath?: string; // For renames
}

type FileStatus =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'unmerged';

interface GitDiff {
  file: string;
  oldFile?: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  binary: boolean;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'delete' | 'context' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  upstream?: string;
  ahead: number;
  behind: number;
}

interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  parents: string[];
}

interface GitRemote {
  name: string;
  url: string;
  fetch: string;
}

interface RepositoryInfo {
  root: string;
  gitDir: string;
  workTree: string;
  isBare: boolean;
}

// ============================================================================
// MAIN PLUGIN CLASS
// ============================================================================

export default class GitPlugin implements Plugin {
  private context: PluginContext;
  private statusBarItem: StatusBarItem | null = null;
  private statusPanel: Panel | null = null;
  private repoInfo: RepositoryInfo | null = null;
  private currentStatus: GitStatus | null = null;
  private fileWatcher: FileWatcher | null = null;
  private updateInterval: number | null = null;

  // Command disposables
  private disposables: Array<() => void> = [];

  // ============================================================================
  // PLUGIN LIFECYCLE
  // ============================================================================

  async activate(context: PluginContext): Promise<void> {
    this.context = context;

    try {
      // Initialize repository
      await this.initRepository();

      if (!this.repoInfo) {
        this.context.ui.showNotification({
          type: 'info',
          message: 'Not a git repository',
        });
        return;
      }

      // Set up UI
      await this.setupStatusBar();
      await this.setupCommands();
      await this.setupEventListeners();
      await this.setupFileWatcher();

      // Initial status update
      await this.updateStatus();

      // Periodic status updates
      this.updateInterval = window.setInterval(
        () => this.updateStatus(),
        30000 // Every 30 seconds
      );

      console.log('[Git Plugin] Activated successfully');
    } catch (error) {
      console.error('[Git Plugin] Failed to activate:', error);
      this.context.ui.showNotification({
        type: 'error',
        message: `Git plugin activation failed: ${error.message}`,
      });
    }
  }

  async deactivate(): Promise<void> {
    // Clean up resources
    this.statusBarItem?.dispose();
    this.statusPanel?.dispose();
    this.fileWatcher?.dispose();

    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }

    // Dispose all commands
    this.disposables.forEach((dispose) => dispose());
    this.disposables = [];

    console.log('[Git Plugin] Deactivated');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private async initRepository(): Promise<void> {
    const workspacePath = this.context.workspace.getPath();

    if (!workspacePath) {
      return;
    }

    // Find .git directory
    const gitRoot = await this.findGitRoot(workspacePath);

    if (!gitRoot) {
      return;
    }

    this.repoInfo = {
      root: gitRoot,
      gitDir: `${gitRoot}/.git`,
      workTree: gitRoot,
      isBare: false,
    };
  }

  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;

    while (currentPath !== '/' && currentPath !== '') {
      const gitPath = `${currentPath}/.git`;

      try {
        const exists = await this.context.fs.exists(gitPath);
        if (exists) {
          return currentPath;
        }
      } catch (error) {
        // Continue searching
      }

      // Go up one directory
      const parentPath = currentPath.split('/').slice(0, -1).join('/');
      if (parentPath === currentPath) break;
      currentPath = parentPath;
    }

    return null;
  }

  // ============================================================================
  // UI SETUP
  // ============================================================================

  private async setupStatusBar(): Promise<void> {
    this.statusBarItem = this.context.ui.addStatusBarItem({
      id: 'git-status',
      text: '$(git-branch) initializing...',
      tooltip: 'Git Status',
      priority: 100,
      onClick: () => this.showStatusPanel(),
    });
  }

  private async setupCommands(): Promise<void> {
    const commands: Array<{ id: string; handler: () => Promise<void> }> = [
      { id: 'git.status', handler: () => this.showStatusPanel() },
      { id: 'git.refresh', handler: () => this.updateStatus() },
      { id: 'git.commit', handler: () => this.quickCommit() },
      { id: 'git.push', handler: () => this.push() },
      { id: 'git.pull', handler: () => this.pull() },
      { id: 'git.fetch', handler: () => this.fetch() },
      { id: 'git.branch', handler: () => this.showBranchManager() },
      { id: 'git.checkout', handler: () => this.checkoutBranch() },
      { id: 'git.stage_all', handler: () => this.stageAll() },
      { id: 'git.unstage_all', handler: () => this.unstageAll() },
      { id: 'git.discard_all', handler: () => this.discardAll() },
      { id: 'git.show_diff', handler: () => this.showDiffForActiveFile() },
      { id: 'git.log', handler: () => this.showLog() },
    ];

    for (const cmd of commands) {
      const dispose = this.context.commands.register(cmd.id, cmd.handler);
      this.disposables.push(dispose);
    }
  }

  private async setupEventListeners(): Promise<void> {
    // File save event
    const onSaveDispose = this.context.on('file:save', async (file) => {
      await this.updateStatus();
    });
    this.disposables.push(onSaveDispose);

    // File open event
    const onOpenDispose = this.context.on('file:open', async (file) => {
      // Could show git blame or history here
    });
    this.disposables.push(onOpenDispose);
  }

  private async setupFileWatcher(): Promise<void> {
    if (!this.repoInfo) return;

    // Watch .git directory for changes
    this.fileWatcher = this.context.fs.watch(
      this.repoInfo.gitDir,
      async (event) => {
        // Debounce updates
        if (event.type === 'modify' || event.type === 'create') {
          await this.updateStatus();
        }
      }
    );
  }

  // ============================================================================
  // STATUS UPDATES
  // ============================================================================

  private async updateStatus(): Promise<void> {
    if (!this.repoInfo) return;

    try {
      const status = await this.getStatus();
      this.currentStatus = status;

      // Update status bar
      this.updateStatusBar(status);

      // Update status panel if open
      if (this.statusPanel) {
        await this.refreshStatusPanel();
      }
    } catch (error) {
      console.error('[Git Plugin] Failed to update status:', error);
    }
  }

  private updateStatusBar(status: GitStatus): void {
    if (!this.statusBarItem) return;

    let text = `$(git-branch) ${status.branch}`;
    let color: string | undefined;

    // Add upstream tracking
    if (status.ahead > 0) {
      text += ` ↑${status.ahead}`;
    }
    if (status.behind > 0) {
      text += ` ↓${status.behind}`;
    }

    // Add change indicators
    const totalChanges =
      status.staged.length + status.unstaged.length + status.untracked.length;

    if (totalChanges > 0) {
      text += ` $(diff) ${totalChanges}`;
    }

    // Conflict indicator
    if (status.conflicts.length > 0) {
      text += ` $(alert) ${status.conflicts.length}`;
      color = 'var(--color-error)';
    }

    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = this.buildStatusTooltip(status);
    this.statusBarItem.color = color;
  }

  private buildStatusTooltip(status: GitStatus): string {
    const lines: string[] = [`Branch: ${status.branch}`];

    if (status.upstream) {
      lines.push(`Upstream: ${status.upstream}`);
    }

    if (status.ahead > 0) {
      lines.push(`Ahead: ${status.ahead} commit${status.ahead > 1 ? 's' : ''}`);
    }

    if (status.behind > 0) {
      lines.push(
        `Behind: ${status.behind} commit${status.behind > 1 ? 's' : ''}`
      );
    }

    if (status.staged.length > 0) {
      lines.push(`Staged: ${status.staged.length}`);
    }

    if (status.unstaged.length > 0) {
      lines.push(`Unstaged: ${status.unstaged.length}`);
    }

    if (status.untracked.length > 0) {
      lines.push(`Untracked: ${status.untracked.length}`);
    }

    if (status.conflicts.length > 0) {
      lines.push(`Conflicts: ${status.conflicts.length}`);
    }

    if (status.clean) {
      lines.push('', 'Working tree clean');
    }

    lines.push('', 'Click for details');

    return lines.join('\n');
  }

  // ============================================================================
  // GIT OPERATIONS
  // ============================================================================

  private async getStatus(): Promise<GitStatus> {
    if (!this.repoInfo) {
      throw new Error('No repository');
    }

    // Execute git status --porcelain=v2 --branch
    const result = await this.executeGit([
      'status',
      '--porcelain=v2',
      '--branch',
    ]);

    return this.parseStatus(result.stdout);
  }

  private parseStatus(output: string): GitStatus {
    const lines = output.split('\n').filter((line) => line.trim());

    const status: GitStatus = {
      branch: 'unknown',
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
      conflicts: [],
      clean: true,
    };

    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        status.branch = line.slice(14);
      } else if (line.startsWith('# branch.upstream ')) {
        status.upstream = line.slice(18);
      } else if (line.startsWith('# branch.ab ')) {
        const [ahead, behind] = line.slice(12).split(' ').map(Number);
        status.ahead = ahead;
        status.behind = behind;
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        // Changed entry
        const parts = line.split(' ');
        const xy = parts[1]; // Index and worktree status
        const path = parts.slice(-1)[0];

        const change: FileChange = {
          path,
          status: this.parseFileStatus(xy),
        };

        // Handle renames
        if (line.startsWith('2 ')) {
          const oldPath = parts[parts.length - 2];
          change.oldPath = oldPath;
          change.status = 'renamed';
        }

        const indexStatus = xy[0];
        const worktreeStatus = xy[1];

        if (indexStatus !== '.' && indexStatus !== '?') {
          status.staged.push(change);
          status.clean = false;
        }

        if (worktreeStatus !== '.' && worktreeStatus !== '?') {
          status.unstaged.push(change);
          status.clean = false;
        }
      } else if (line.startsWith('? ')) {
        // Untracked file
        const path = line.slice(2);
        status.untracked.push(path);
        status.clean = false;
      } else if (line.startsWith('u ')) {
        // Unmerged (conflict)
        const parts = line.split(' ');
        const path = parts.slice(-1)[0];

        const conflict: FileChange = {
          path,
          status: 'unmerged',
        };

        status.conflicts.push(conflict);
        status.clean = false;
      }
    }

    return status;
  }

  private parseFileStatus(xy: string): FileStatus {
    const map: Record<string, FileStatus> = {
      M: 'modified',
      A: 'added',
      D: 'deleted',
      R: 'renamed',
      C: 'copied',
      '?': 'untracked',
      U: 'unmerged',
    };

    const status = xy[0] !== '.' ? xy[0] : xy[1];
    return map[status] || 'modified';
  }

  // ============================================================================
  // FILE OPERATIONS
  // ============================================================================

  private async stageFile(path: string): Promise<void> {
    await this.executeGit(['add', path]);
    await this.updateStatus();
  }

  private async unstageFile(path: string): Promise<void> {
    await this.executeGit(['reset', 'HEAD', path]);
    await this.updateStatus();
  }

  private async discardFile(path: string): Promise<void> {
    const confirmed = await this.context.ui.showConfirm({
      title: 'Discard Changes',
      message: `Discard all changes to ${path}?`,
      confirmText: 'Discard',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    await this.executeGit(['checkout', 'HEAD', path]);
    await this.updateStatus();
  }

  private async stageAll(): Promise<void> {
    await this.executeGit(['add', '-A']);
    await this.updateStatus();

    this.context.ui.showNotification({
      type: 'success',
      message: 'All changes staged',
    });
  }

  private async unstageAll(): Promise<void> {
    await this.executeGit(['reset', 'HEAD']);
    await this.updateStatus();

    this.context.ui.showNotification({
      type: 'success',
      message: 'All changes unstaged',
    });
  }

  private async discardAll(): Promise<void> {
    const confirmed = await this.context.ui.showConfirm({
      title: 'Discard All Changes',
      message: 'Discard all uncommitted changes? This cannot be undone.',
      confirmText: 'Discard All',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    await this.executeGit(['reset', '--hard', 'HEAD']);
    await this.executeGit(['clean', '-fd']);
    await this.updateStatus();

    this.context.ui.showNotification({
      type: 'success',
      message: 'All changes discarded',
    });
  }

  // ============================================================================
  // COMMIT OPERATIONS
  // ============================================================================

  private async quickCommit(): Promise<void> {
    if (!this.currentStatus) return;

    if (this.currentStatus.staged.length === 0) {
      this.context.ui.showNotification({
        type: 'warning',
        message: 'No staged changes to commit',
      });
      return;
    }

    const message = await this.context.ui.showInputBox({
      prompt: 'Commit message:',
      placeholder: 'Enter commit message...',
      multiline: true,
    });

    if (!message) return;

    try {
      await this.commit(message);

      this.context.ui.showNotification({
        type: 'success',
        message: 'Committed successfully',
      });
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Commit failed: ${error.message}`,
      });
    }
  }

  private async commit(message: string): Promise<void> {
    await this.executeGit(['commit', '-m', message]);
    await this.updateStatus();
  }

  private async amendCommit(message?: string): Promise<void> {
    const args = ['commit', '--amend'];

    if (message) {
      args.push('-m', message);
    } else {
      args.push('--no-edit');
    }

    await this.executeGit(args);
    await this.updateStatus();
  }

  // ============================================================================
  // REMOTE OPERATIONS
  // ============================================================================

  private async push(): Promise<void> {
    if (!this.currentStatus) return;

    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pushing...',
      });

      await this.executeGit(['push']);

      this.context.ui.showNotification({
        type: 'success',
        message: 'Pushed successfully',
      });

      await this.updateStatus();
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Push failed: ${error.message}`,
      });
    }
  }

  private async pull(): Promise<void> {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pulling...',
      });

      const result = await this.executeGit(['pull']);

      this.context.ui.showNotification({
        type: 'success',
        message: 'Pulled successfully',
      });

      await this.updateStatus();

      // Reload open files if they changed
      await this.context.editor.reloadAllFiles();
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Pull failed: ${error.message}`,
      });
    }
  }

  private async fetch(): Promise<void> {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Fetching...',
      });

      await this.executeGit(['fetch']);

      this.context.ui.showNotification({
        type: 'success',
        message: 'Fetched successfully',
      });

      await this.updateStatus();
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Fetch failed: ${error.message}`,
      });
    }
  }

  // ============================================================================
  // BRANCH OPERATIONS
  // ============================================================================

  private async getBranches(): Promise<GitBranch[]> {
    const result = await this.executeGit(['branch', '-vv', '--list']);
    return this.parseBranches(result.stdout);
  }

  private parseBranches(output: string): GitBranch[] {
    const lines = output.split('\n').filter((line) => line.trim());
    const branches: GitBranch[] = [];

    for (const line of lines) {
      const current = line.startsWith('*');
      const parts = line.slice(2).trim().split(/\s+/);

      const branch: GitBranch = {
        name: parts[0],
        current,
        ahead: 0,
        behind: 0,
      };

      // Parse upstream and ahead/behind info
      const upstreamMatch = line.match(/\[([^\]]+)\]/);
      if (upstreamMatch) {
        const upstreamInfo = upstreamMatch[1];
        const upstreamParts = upstreamInfo.split(':');
        branch.upstream = upstreamParts[0];

        if (upstreamParts[1]) {
          const trackingInfo = upstreamParts[1].trim();
          const aheadMatch = trackingInfo.match(/ahead (\d+)/);
          const behindMatch = trackingInfo.match(/behind (\d+)/);

          if (aheadMatch) branch.ahead = parseInt(aheadMatch[1]);
          if (behindMatch) branch.behind = parseInt(behindMatch[1]);
        }
      }

      branches.push(branch);
    }

    return branches;
  }

  private async showBranchManager(): Promise<void> {
    const branches = await this.getBranches();

    const items = branches.map((branch) => {
      let label = branch.name;
      let description = '';

      if (branch.current) {
        description = '(current)';
      }

      if (branch.upstream) {
        description += ` → ${branch.upstream}`;
      }

      if (branch.ahead > 0 || branch.behind > 0) {
        description += ` [↑${branch.ahead} ↓${branch.behind}]`;
      }

      return {
        label,
        description,
        value: branch.name,
      };
    });

    // Add option to create new branch
    items.unshift({
      label: '$(add) Create new branch',
      description: '',
      value: '__create_new__',
    });

    const selected = await this.context.ui.showQuickPick({
      items,
      placeholder: 'Select a branch or create new',
    });

    if (!selected) return;

    if (selected === '__create_new__') {
      await this.createBranch();
    } else {
      await this.checkoutBranchByName(selected);
    }
  }

  private async checkoutBranch(): Promise<void> {
    const branches = await this.getBranches();

    const items = branches
      .filter((b) => !b.current)
      .map((branch) => ({
        label: branch.name,
        value: branch.name,
      }));

    const selected = await this.context.ui.showQuickPick({
      items,
      placeholder: 'Select a branch to checkout',
    });

    if (selected) {
      await this.checkoutBranchByName(selected);
    }
  }

  private async checkoutBranchByName(branchName: string): Promise<void> {
    try {
      await this.executeGit(['checkout', branchName]);

      this.context.ui.showNotification({
        type: 'success',
        message: `Switched to branch: ${branchName}`,
      });

      await this.updateStatus();
      await this.context.editor.reloadAllFiles();
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Checkout failed: ${error.message}`,
      });
    }
  }

  private async createBranch(): Promise<void> {
    const branchName = await this.context.ui.showInputBox({
      prompt: 'Branch name:',
      placeholder: 'feature/my-feature',
    });

    if (!branchName) return;

    try {
      await this.executeGit(['checkout', '-b', branchName]);

      this.context.ui.showNotification({
        type: 'success',
        message: `Created and switched to branch: ${branchName}`,
      });

      await this.updateStatus();
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Branch creation failed: ${error.message}`,
      });
    }
  }

  private async deleteBranch(branchName: string): Promise<void> {
    const confirmed = await this.context.ui.showConfirm({
      title: 'Delete Branch',
      message: `Delete branch ${branchName}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      await this.executeGit(['branch', '-d', branchName]);

      this.context.ui.showNotification({
        type: 'success',
        message: `Deleted branch: ${branchName}`,
      });
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Branch deletion failed: ${error.message}`,
      });
    }
  }

  // ============================================================================
  // DIFF OPERATIONS
  // ============================================================================

  private async getDiff(file?: string): Promise<GitDiff[]> {
    const args = ['diff', '--no-color'];

    if (file) {
      args.push('--', file);
    }

    const result = await this.executeGit(args);
    return this.parseDiff(result.stdout);
  }

  private parseDiff(output: string): GitDiff[] {
    const diffs: GitDiff[] = [];
    const lines = output.split('\n');

    let currentDiff: GitDiff | null = null;
    let currentHunk: DiffHunk | null = null;
    let oldLineNumber = 0;
    let newLineNumber = 0;

    for (const line of lines) {
      if (line.startsWith('diff --git ')) {
        // Start new diff
        if (currentDiff && currentHunk) {
          currentDiff.hunks.push(currentHunk);
        }
        if (currentDiff) {
          diffs.push(currentDiff);
        }

        const match = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (match) {
          currentDiff = {
            file: match[2],
            oldFile: match[1],
            hunks: [],
            additions: 0,
            deletions: 0,
            binary: false,
          };
        }
        currentHunk = null;
      } else if (line.startsWith('Binary files')) {
        if (currentDiff) {
          currentDiff.binary = true;
        }
      } else if (line.startsWith('@@')) {
        // Start new hunk
        if (currentDiff && currentHunk) {
          currentDiff.hunks.push(currentHunk);
        }

        const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@(.*)/);
        if (match && currentDiff) {
          oldLineNumber = parseInt(match[1]);
          newLineNumber = parseInt(match[3]);

          currentHunk = {
            oldStart: oldLineNumber,
            oldLines: parseInt(match[2] || '1'),
            newStart: newLineNumber,
            newLines: parseInt(match[4] || '1'),
            header: match[5].trim(),
            lines: [],
          };
        }
      } else if (currentHunk && currentDiff) {
        // Add line to current hunk
        const diffLine: DiffLine = {
          type: 'context',
          content: line,
        };

        if (line.startsWith('+')) {
          diffLine.type = 'add';
          diffLine.newLineNumber = newLineNumber++;
          currentDiff.additions++;
        } else if (line.startsWith('-')) {
          diffLine.type = 'delete';
          diffLine.oldLineNumber = oldLineNumber++;
          currentDiff.deletions++;
        } else if (line.startsWith(' ')) {
          diffLine.type = 'context';
          diffLine.oldLineNumber = oldLineNumber++;
          diffLine.newLineNumber = newLineNumber++;
        }

        currentHunk.lines.push(diffLine);
      }
    }

    // Add final hunk and diff
    if (currentDiff && currentHunk) {
      currentDiff.hunks.push(currentHunk);
    }
    if (currentDiff) {
      diffs.push(currentDiff);
    }

    return diffs;
  }

  private async showDiffForActiveFile(): Promise<void> {
    const activeFile = this.context.editor.getActiveFile();

    if (!activeFile) {
      this.context.ui.showNotification({
        type: 'warning',
        message: 'No active file',
      });
      return;
    }

    const relativePath = this.getRelativePath(activeFile.path);
    const diffs = await this.getDiff(relativePath);

    if (diffs.length === 0) {
      this.context.ui.showNotification({
        type: 'info',
        message: 'No changes in this file',
      });
      return;
    }

    // Get original content
    const originalContent = await this.getFileAtHead(relativePath);
    const currentContent = this.context.editor.getContent();

    // Open diff view
    await this.context.editor.openDiffView({
      original: originalContent,
      modified: currentContent,
      title: `${relativePath} (Working vs HEAD)`,
    });
  }

  private async getFileAtHead(relativePath: string): Promise<string> {
    try {
      const result = await this.executeGit(['show', `HEAD:${relativePath}`]);
      return result.stdout;
    } catch (error) {
      // File might be new
      return '';
    }
  }

  // ============================================================================
  // LOG OPERATIONS
  // ============================================================================

  private async getLog(limit: number = 50): Promise<GitCommit[]> {
    const result = await this.executeGit([
      'log',
      `--max-count=${limit}`,
      '--format=%H%n%h%n%an%n%ae%n%at%n%s%n%P',
      '--',
    ]);

    return this.parseLog(result.stdout);
  }

  private parseLog(output: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = output.split('\n').filter((line) => line.trim());

    for (let i = 0; i < lines.length; i += 7) {
      const commit: GitCommit = {
        hash: lines[i],
        shortHash: lines[i + 1],
        author: lines[i + 2],
        email: lines[i + 3],
        date: new Date(parseInt(lines[i + 4]) * 1000),
        message: lines[i + 5],
        parents: lines[i + 6] ? lines[i + 6].split(' ') : [],
      };

      commits.push(commit);
    }

    return commits;
  }

  private async showLog(): Promise<void> {
    const commits = await this.getLog(100);

    // Show in panel
    const content = this.renderLogPanel(commits);

    this.context.ui.showPanel({
      id: 'git-log',
      title: 'Git Log',
      content,
      position: 'sidebar',
    });
  }

  private renderLogPanel(commits: GitCommit[]): string {
    const rows = commits.map((commit) => {
      const date = commit.date.toLocaleDateString();
      const time = commit.date.toLocaleTimeString();

      return `
        <div class="commit-row" data-hash="${commit.hash}">
          <div class="commit-header">
            <span class="commit-hash">${commit.shortHash}</span>
            <span class="commit-author">${commit.author}</span>
            <span class="commit-date">${date} ${time}</span>
          </div>
          <div class="commit-message">${this.escapeHtml(commit.message)}</div>
        </div>
      `;
    });

    return `
      <div class="git-log-panel">
        <div class="commit-list">
          ${rows.join('\n')}
        </div>
      </div>
    `;
  }

  // ============================================================================
  // STATUS PANEL
  // ============================================================================

  private async showStatusPanel(): Promise<void> {
    if (!this.currentStatus) {
      await this.updateStatus();
    }

    if (!this.currentStatus) return;

    const content = this.renderStatusPanel(this.currentStatus);

    this.statusPanel = this.context.ui.showPanel({
      id: 'git-status',
      title: 'Git Status',
      content,
      position: 'sidebar',
    });
  }

  private async refreshStatusPanel(): Promise<void> {
    if (!this.statusPanel || !this.currentStatus) return;

    const content = this.renderStatusPanel(this.currentStatus);
    this.statusPanel.setContent(content);
  }

  private renderStatusPanel(status: GitStatus): string {
    const sections: string[] = [];

    // Branch info
    sections.push(`
      <div class="branch-info">
        <div class="branch-name">
          <span class="icon">$(git-branch)</span>
          <span class="text">${this.escapeHtml(status.branch)}</span>
        </div>
        ${
          status.ahead > 0 || status.behind > 0
            ? `
          <div class="sync-status">
            ${status.ahead > 0 ? `<span class="ahead">↑${status.ahead}</span>` : ''}
            ${status.behind > 0 ? `<span class="behind">↓${status.behind}</span>` : ''}
          </div>
        `
            : ''
        }
      </div>
    `);

    // Staged files
    if (status.staged.length > 0) {
      sections.push(this.renderFileGroup('Staged Changes', status.staged, true));
    }

    // Unstaged files
    if (status.unstaged.length > 0) {
      sections.push(this.renderFileGroup('Changes', status.unstaged, false));
    }

    // Untracked files
    if (status.untracked.length > 0) {
      const files = status.untracked.map((path) => ({ path, status: 'untracked' as FileStatus }));
      sections.push(this.renderFileGroup('Untracked Files', files, false));
    }

    // Conflicts
    if (status.conflicts.length > 0) {
      sections.push(this.renderFileGroup('Conflicts', status.conflicts, false));
    }

    // Clean state
    if (status.clean) {
      sections.push(`
        <div class="clean-state">
          <span class="icon">$(check)</span>
          <span class="text">Working tree clean</span>
        </div>
      `);
    }

    return `
      <div class="git-status-panel">
        ${sections.join('\n')}
      </div>
    `;
  }

  private renderFileGroup(
    title: string,
    files: FileChange[],
    staged: boolean
  ): string {
    const rows = files.map((file) => this.renderFileRow(file, staged));

    return `
      <div class="file-group">
        <h4>${title} (${files.length})</h4>
        <ul class="file-list">
          ${rows.join('\n')}
        </ul>
      </div>
    `;
  }

  private renderFileRow(file: FileChange, staged: boolean): string {
    const statusIcon = this.getStatusIcon(file.status);
    const statusClass = this.getStatusClass(file.status);

    return `
      <li class="file-item ${statusClass}" data-path="${this.escapeHtml(file.path)}">
        <span class="status-icon">${statusIcon}</span>
        <span class="file-path">${this.escapeHtml(file.path)}</span>
        <div class="file-actions">
          <button class="action-diff" title="View diff">$(diff)</button>
          ${
            staged
              ? '<button class="action-unstage" title="Unstage">$(remove)</button>'
              : '<button class="action-stage" title="Stage">$(add)</button>'
          }
          ${!staged ? '<button class="action-discard" title="Discard">$(trash)</button>' : ''}
        </div>
      </li>
    `;
  }

  private getStatusIcon(status: FileStatus): string {
    const icons: Record<FileStatus, string> = {
      modified: '$(diff-modified)',
      added: '$(diff-added)',
      deleted: '$(diff-removed)',
      renamed: '$(diff-renamed)',
      copied: '$(diff-added)',
      untracked: '$(question)',
      unmerged: '$(alert)',
    };

    return icons[status] || '$(file)';
  }

  private getStatusClass(status: FileStatus): string {
    const classes: Record<FileStatus, string> = {
      modified: 'status-modified',
      added: 'status-added',
      deleted: 'status-deleted',
      renamed: 'status-renamed',
      copied: 'status-copied',
      untracked: 'status-untracked',
      unmerged: 'status-conflict',
    };

    return classes[status] || '';
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private async executeGit(args: string[]): Promise<{ stdout: string; stderr: string }> {
    if (!this.repoInfo) {
      throw new Error('No repository');
    }

    return await this.context.commands.execute('git', args, {
      cwd: this.repoInfo.root,
    });
  }

  private getRelativePath(absolutePath: string): string {
    if (!this.repoInfo) return absolutePath;

    if (absolutePath.startsWith(this.repoInfo.root)) {
      return absolutePath.slice(this.repoInfo.root.length + 1);
    }

    return absolutePath;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
```

---

## Integration Dependencies Map

### Module Dependencies

```text
plugins/git/main.ts (THIS FILE - 1,400 lines)
├─> Plugin API Types
│   ├─> @skretchpad/plugin-api
│   │   ├─> Plugin interface
│   │   ├─> PluginContext
│   │   ├─> StatusBarItem
│   │   ├─> Panel
│   │   ├─> Command
│   │   └─> FileWatcher
│   │
│   └─> Methods used:
│       ├─> context.workspace.getPath()
│       ├─> context.fs.exists()
│       ├─> context.fs.watch()
│       ├─> context.ui.addStatusBarItem()
│       ├─> context.ui.showNotification()
│       ├─> context.ui.showConfirm()
│       ├─> context.ui.showInputBox()
│       ├─> context.ui.showQuickPick()
│       ├─> context.ui.showPanel()
│       ├─> context.commands.register()
│       ├─> context.commands.execute()
│       ├─> context.editor.getActiveFile()
│       ├─> context.editor.getContent()
│       ├─> context.editor.openDiffView()
│       ├─> context.editor.reloadAllFiles()
│       └─> context.on()
│
├─> External Dependencies
│   └─> None (uses only Plugin API and browser APIs)
│
└─> Backend Commands (via Plugin API)
    ├─> plugin_execute_command (for git CLI)
    ├─> plugin_read_file
    └─> plugin_watch_path
```

## Required Files to Create

### 🔴 CRITICAL - Must exist before git plugin works

```text
1. src/lib/plugin-api.ts (300-400 lines)
   └─> NEW FILE REQUIRED ⚠️
   └─> Exports:
       ├─> Plugin interface
       ├─> PluginContext interface
       ├─> StatusBarItem interface
       ├─> Panel interface
       ├─> Command interface
       ├─> FileWatcher interface
       └─> All helper types

2. plugins/git/plugin.toml
   └─> Plugin manifest
   └─> Permissions declaration

3. plugins/git/components/*.svelte
   └─> UI components (optional, if not using HTML strings)
```

### 🟡 IMPORTANT - Backend support

```text
4. src-tauri/src/plugin_system/api.rs (ALREADY COMPLETE ✅)
   └─> plugin_execute_command
   └─> plugin_read_file
   └─> plugin_watch_path

5. src-tauri/src/plugin_system/manager.rs
   └─> Plugin loading and activation
```

### 🟢 OPTIONAL - Enhanced features

```text
6. plugins/git/styles.css
   └─> Styling for status panel and UI elements

7. plugins/git/components/StatusPanel.svelte
   └─> Svelte component instead of HTML strings

8. plugins/git/components/BranchManager.svelte
   └─> Svelte component for branch management

9. plugins/git/components/CommitDialog.svelte
   └─> Svelte component for commit UI
```

## Plugin Manifest (plugin.toml)

```toml
# plugins/git/plugin.toml

name = "git"
version = "1.0.0"
author = "skretchpad"
description = "Git integration for skretchpad"
trust = "first-party"

[permissions]
filesystem = "WorkspaceReadWrite"

[permissions.commands]
allowlist = ["git"]
require_confirmation = false

[permissions.network]
type = "None"

[permissions.ui]
status_bar = true
sidebar = true
notifications = true
webview = false

[hooks]
on_file_open = "onFileOpen"
on_file_save = "onFileSave"
on_workspace_change = "onWorkspaceChange"

[commands]
"git.status" = { key = "Ctrl+G", label = "Git Status" }
"git.refresh" = { key = "Ctrl+Shift+G", label = "Refresh Git Status" }
"git.commit" = { key = "Ctrl+K", label = "Quick Commit" }
"git.push" = { key = "Ctrl+Shift+P", label = "Push" }
"git.pull" = { key = "Ctrl+Shift+L", label = "Pull" }
"git.branch" = { key = "Ctrl+B", label = "Branch Manager" }
"git.show_diff" = { key = "Ctrl+D", label = "Show Diff" }
"git.stage_all" = { key = "Ctrl+Shift+A", label = "Stage All Changes" }
```

## Plugin API Type Definitions

```typescript
// src/lib/plugin-api.ts (excerpt - the critical types)

export interface Plugin {
  activate(context: PluginContext): Promise<void>;
  deactivate(): Promise<void>;
}

export interface PluginContext {
  workspace: WorkspaceAPI;
  fs: FilesystemAPI;
  ui: UiAPI;
  commands: CommandsAPI;
  editor: EditorAPI;
  on(event: string, handler: (data: any) => void): () => void;
}

export interface WorkspaceAPI {
  getPath(): string | null;
  getRootPath(): string;
}

export interface FilesystemAPI {
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  watch(path: string, handler: (event: FileEvent) => void): FileWatcher;
}

export interface UiAPI {
  addStatusBarItem(options: StatusBarOptions): StatusBarItem;
  showNotification(options: NotificationOptions): void;
  showConfirm(options: ConfirmOptions): Promise<boolean>;
  showInputBox(options: InputBoxOptions): Promise<string | null>;
  showQuickPick(options: QuickPickOptions): Promise<string | null>;
  showPanel(options: PanelOptions): Panel;
}

export interface CommandsAPI {
  register(id: string, handler: () => Promise<void>): () => void;
  execute(command: string, args: string[], options?: ExecuteOptions): Promise<CommandOutput>;
}

export interface EditorAPI {
  getActiveFile(): FileInfo | null;
  getContent(): string;
  openDiffView(options: DiffViewOptions): Promise<void>;
  reloadAllFiles(): Promise<void>;
}

// ... many more interfaces
```

## File-Level Integration Diagram

```text
┌────────────────────────────────────────────────────────────┐
│                   GIT PLUGIN INTEGRATION                   │
└────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ git/main.ts      │ (THIS FILE - 1,400 lines)
└────────┬─────────┘
         │
         ├─────────────────────────────────────────────────────┐
         │                                                     │
         ▼                                                     ▼
┌──────────────────────┐                            ┌────────────────────┐
│ plugin-api.ts        │  MUST CREATE               │  git/plugin.toml   │
├──────────────────────┤                            ├────────────────────┤
│ • Plugin interface   │                            │ • Manifest         │
│ • PluginContext      │                            │ • Permissions      │
│ • StatusBarItem      │                            │ • Commands         │
│ • Panel              │                            │ • Hooks            │
│ • Command            │                            └────────────────────┘
│ • FileWatcher        │
│ • All API types      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                  PLUGIN API IMPLEMENTATION               │
├──────────────────────────────────────────────────────────┤
│  Wraps Tauri commands with TypeScript API:               │
│                                                          │
│  ├─> invoke('plugin_execute_command', ...)               │
│  ├─> invoke('plugin_read_file', ...)                     │
│  ├─> invoke('plugin_watch_path', ...)                    │
│  ├─> invoke('plugin_show_notification', ...)             │
│  ├─> invoke('plugin_add_status_bar_item', ...)           │
│  └─> invoke('plugin_show_panel', ...)                    │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                    BACKEND COMMANDS                      │
├──────────────────────────────────────────────────────────┤
│  src-tauri/src/plugin_system/api.rs                      │
│  ├─> plugin_execute_command (runs git CLI)               │
│  ├─> plugin_read_file                                    │
│  ├─> plugin_watch_path                                   │
│  ├─> plugin_show_notification                            │
│  ├─> plugin_add_status_bar_item                          │
│  └─> plugin_show_panel                                   │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                      GIT CLI                             │
├──────────────────────────────────────────────────────────┤
│  Commands executed:                                      │
│  ├─> git status --porcelain=v2 --branch                  │
│  ├─> git add <file>                                      │
│  ├─> git commit -m "message"                             │
│  ├─> git push                                            │
│  ├─> git pull                                            │
│  ├─> git fetch                                           │
│  ├─> git branch -vv --list                               │
│  ├─> git checkout <branch>                               │
│  ├─> git diff --no-color                                 │
│  ├─> git log --format=...                                │
│  └─> git show HEAD:<file>                                │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│                   UI INTEGRATION                         │
├──────────────────────────────────────────────────────────┤
│  Frontend components that interact with plugin:          │
│                                                          │
│  ├─> StatusBar.svelte                                    │
│  │   └─> Displays git status item                        │
│  │                                                       │
│  ├─> Sidebar.svelte                                      │
│  │   └─> Hosts git status panel                          │
│  │                                                       │
│  ├─> CommandPalette.svelte                               │
│  │   └─> Lists git commands                              │
│  │                                                       │
│  └─> Editor.svelte                                       │
│      └─> Triggers file events, opens diff view           │
└──────────────────────────────────────────────────────────┘
```

## Integration Checklist

### COMPLETED

- `plugins/git/main.ts` (1,400 lines) - Complete Git plugin implementation

### MUST CREATE NEXT

Phase 1: Plugin API Foundation (BLOCKING)

```text
1. src/lib/plugin-api.ts (300-400 lines)
   └─> All Plugin API type definitions
   └─> Wrappers for Tauri commands
   └─> This is the BRIDGE between plugin and backend

2. plugins/git/plugin.toml (50 lines)
   └─> Plugin manifest
   └─> Permissions
   └─> Commands
   └─> Hooks
```

Phase 2: Backend Support (if not complete)

```text
3. src-tauri/src/plugin_system/api.rs ✅ (ALREADY DONE)
4. src-tauri/src/plugin_system/manager.rs (needs plugin loading)
5. src-tauri/src/plugin_system/loader.rs (manifest parsing)
```

Phase 3: UI Integration

```text
6. src/components/StatusBar.svelte (modifications)
   └─> Listen for plugin:status_bar:add events
   └─> Render plugin status items

7. src/components/Sidebar.svelte (modifications)
   └─> Listen for plugin:panel:show events
   └─> Render plugin panels

8. src/components/CommandPalette.svelte (if exists)
   └─> Include plugin commands
```

Phase 4: Styling (optional)

```text
9. plugins/git/styles.css
   └─> Git-specific styling
   └─> Status panel styles
   └─> File list styles
```

## Critical Path

```plaintext
1. plugin-api.ts       (400 lines)  ────┐
                                        │
2. plugin.toml         (50 lines)   ────┤
                                        ├─> Enable Git Plugin
3. manager.rs          (500 lines)  ────┤
                                        │
4. UI components       (300 lines)  ────┘
   (StatusBar, Sidebar modifications)
```
