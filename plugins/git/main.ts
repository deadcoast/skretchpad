// plugins/git/main.ts
import type { Plugin, PluginContext, StatusBarItem } from '@skretchpad/plugin-api';

interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: number;
  unstaged: number;
  untracked: number;
  conflicts: number;
}

interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export default class GitPlugin implements Plugin {
  private context: PluginContext;
  private statusBarItem: StatusBarItem;
  private repositoryRoot: string | null = null;
  private currentBranch: string = '';
  private watcherDispose: (() => void) | null = null;
  
  async activate(context: PluginContext) {
    this.context = context;
    
    // Initialize repository
    await this.initRepository();
    
    // Create status bar item
    this.statusBarItem = context.ui.addStatusBarItem({
      id: 'git-status',
      text: '$(git-branch) main',
      tooltip: 'Click for Git status',
      priority: 100,
      onClick: () => this.showStatus(),
    });
    
    // Register commands
    context.commands.register('git.status', () => this.showStatus());
    context.commands.register('git.diff', () => this.showDiff());
    context.commands.register('git.commit', () => this.quickCommit());
    context.commands.register('git.push', () => this.push());
    context.commands.register('git.pull', () => this.pull());
    context.commands.register('git.branch', () => this.showBranchManager());
    
    // Set up file watchers
    this.watchGitDirectory();
    
    // Hook into editor events
    context.on('file:save', (file) => this.onFileSave(file));
    context.on('file:open', (file) => this.onFileOpen(file));
    
    // Initial status update
    await this.updateStatus();
  }
  
  async deactivate() {
    this.statusBarItem?.dispose();
    this.watcherDispose?.();
  }
  
  private async initRepository() {
    // Find .git directory
    const workspace = this.context.workspace.getPath();
    this.repositoryRoot = await this.findGitRoot(workspace);
    
    if (this.repositoryRoot) {
      this.currentBranch = await this.getCurrentBranch();
    }
  }
  
  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = startPath;
    
    while (currentPath !== '/') {
      const gitPath = `${currentPath}/.git`;
      const exists = await this.context.fs.exists(gitPath);
      
      if (exists) {
        return currentPath;
      }
      
      // Go up one directory
      currentPath = currentPath.split('/').slice(0, -1).join('/');
    }
    
    return null;
  }
  
  private async getCurrentBranch(): Promise<string> {
    if (!this.repositoryRoot) return '';
    
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot,
      'branch', '--show-current'
    ]);
    
    return result.stdout.trim();
  }
  
  private async getGitStatus(): Promise<GitStatus> {
    if (!this.repositoryRoot) {
      throw new Error('Not a git repository');
    }
    
    // Get detailed status
    const statusResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot,
      'status', '--porcelain=v2', '--branch'
    ]);
    
    return this.parseGitStatus(statusResult.stdout);
  }
  
  private parseGitStatus(output: string): GitStatus {
    const lines = output.split('\n');
    const status: GitStatus = {
      branch: '',
      ahead: 0,
      behind: 0,
      staged: 0,
      unstaged: 0,
      untracked: 0,
      conflicts: 0,
    };
    
    for (const line of lines) {
      if (line.startsWith('# branch.head ')) {
        status.branch = line.slice(14);
      } else if (line.startsWith('# branch.ab ')) {
        const [ahead, behind] = line.slice(12).split(' ').map(Number);
        status.ahead = ahead;
        status.behind = behind;
      } else if (line.startsWith('1 ') || line.startsWith('2 ')) {
        // File status: 1 XY ... or 2 XY ... (renamed)
        const [, xy] = line.split(' ');
        const [staged_char, unstaged_char] = xy;
        
        if (staged_char !== '.') status.staged++;
        if (unstaged_char !== '.') status.unstaged++;
      } else if (line.startsWith('? ')) {
        status.untracked++;
      } else if (line.startsWith('u ')) {
        status.conflicts++;
      }
    }
    
    return status;
  }
  
  private async updateStatus() {
    if (!this.repositoryRoot) {
      this.statusBarItem.text = '$(git-branch) No repo';
      return;
    }
    
    try {
      const status = await this.getGitStatus();
      
      // Build status text
      let text = `$(git-branch) ${status.branch}`;
      
      if (status.ahead > 0) text += ` ↑${status.ahead}`;
      if (status.behind > 0) text += ` ↓${status.behind}`;
      
      const totalChanges = status.staged + status.unstaged + status.untracked;
      if (totalChanges > 0) {
        text += ` $(diff) ${totalChanges}`;
      }
      
      if (status.conflicts > 0) {
        text += ` $(alert) ${status.conflicts}`;
        this.statusBarItem.color = 'var(--color-error)';
      } else {
        this.statusBarItem.color = undefined;
      }
      
      this.statusBarItem.text = text;
      this.statusBarItem.tooltip = this.buildTooltip(status);
      
    } catch (error) {
      console.error('Failed to update git status:', error);
      this.statusBarItem.text = '$(git-branch) Error';
    }
  }
  
  private buildTooltip(status: GitStatus): string {
    const parts = [
      `Branch: ${status.branch}`,
    ];
    
    if (status.ahead > 0) {
      parts.push(`Ahead: ${status.ahead} commit${status.ahead > 1 ? 's' : ''}`);
    }
    if (status.behind > 0) {
      parts.push(`Behind: ${status.behind} commit${status.behind > 1 ? 's' : ''}`);
    }
    if (status.staged > 0) {
      parts.push(`Staged: ${status.staged}`);
    }
    if (status.unstaged > 0) {
      parts.push(`Unstaged: ${status.unstaged}`);
    }
    if (status.untracked > 0) {
      parts.push(`Untracked: ${status.untracked}`);
    }
    if (status.conflicts > 0) {
      parts.push(`Conflicts: ${status.conflicts}`);
    }
    
    parts.push('', 'Click for details');
    
    return parts.join('\n');
  }
  
  private async showStatus() {
    const status = await this.getGitStatus();
    
    // Get file list
    const filesResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'status', '--porcelain'
    ]);
    
    const files = this.parseFileList(filesResult.stdout);
    
    // Show in sidebar panel
    this.context.ui.showPanel({
      id: 'git-status',
      title: 'Git Status',
      content: this.renderStatusPanel(status, files),
    });
  }
  
  private parseFileList(output: string): Array<{ status: string; path: string }> {
    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        status: line.slice(0, 2),
        path: line.slice(3),
      }));
  }
  
  private async showDiff() {
    const editor = this.context.editor.getActiveEditor();
    if (!editor) {
      this.context.ui.showNotification({
        type: 'warning',
        message: 'No active file',
      });
      return;
    }
    
    const filePath = editor.getPath();
    const relativePath = filePath.replace(this.repositoryRoot! + '/', '');
    
    // Get diff for current file
    const diffResult = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'diff', '--', relativePath
    ]);
    
    if (!diffResult.stdout.trim()) {
      this.context.ui.showNotification({
        type: 'info',
        message: 'No changes in this file',
      });
      return;
    }
    
    const diff = this.parseDiff(diffResult.stdout);
    
    // Open diff view
    this.context.editor.openDiffView({
      original: await this.getFileAtHead(relativePath),
      modified: editor.getValue(),
      title: `${relativePath} (Working vs HEAD)`,
    });
  }
  
  private async getFileAtHead(relativePath: string): Promise<string> {
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'show', `HEAD:${relativePath}`
    ]);
    
    return result.stdout;
  }
  
  private parseDiff(output: string): FileDiff {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let additions = 0;
    let deletions = 0;
    
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Hunk header: @@ -1,4 +1,5 @@
      if (line.startsWith('@@')) {
        if (currentHunk) {
          hunks.push(currentHunk);
        }
        
        const match = line.match(/@@ -(\d+),?(\d+)? \+(\d+),?(\d+)? @@/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            lines: [],
          };
        }
      } else if (currentHunk) {
        currentHunk.lines.push(line);
        
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }
    }
    
    if (currentHunk) {
      hunks.push(currentHunk);
    }
    
    return {
      path: '', // Extracted from diff header
      status: 'modified',
      additions,
      deletions,
      hunks,
    };
  }
  
  private async quickCommit() {
    const message = await this.context.ui.showInputBox({
      prompt: 'Commit message:',
      placeholder: 'Fix bug in ...',
    });
    
    if (!message) return;
    
    try {
      // Stage all changes
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'add', '-A'
      ]);
      
      // Commit
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'commit', '-m', message
      ]);
      
      this.context.ui.showNotification({
        type: 'success',
        message: 'Committed successfully',
      });
      
      await this.updateStatus();
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Commit failed: ${error.message}`,
      });
    }
  }
  
  private async push() {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pushing...',
      });
      
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'push'
      ]);
      
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
  
  private async pull() {
    try {
      this.context.ui.showNotification({
        type: 'info',
        message: 'Pulling...',
      });
      
      const result = await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'pull'
      ]);
      
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
  
  private async showBranchManager() {
    const branches = await this.getBranches();
    
    this.context.ui.showQuickPick({
      items: branches.map(branch => ({
        label: branch.name,
        description: branch.current ? '(current)' : '',
        value: branch.name,
      })),
      placeholder: 'Select a branch or type to create new',
      onSelect: async (value) => {
        await this.checkoutBranch(value);
      },
    });
  }
  
  private async getBranches(): Promise<Array<{ name: string; current: boolean }>> {
    const result = await this.context.commands.execute('git', [
      '-C', this.repositoryRoot!,
      'branch', '--list'
    ]);
    
    return result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => ({
        name: line.slice(2).trim(),
        current: line.startsWith('*'),
      }));
  }
  
  private async checkoutBranch(branch: string) {
    try {
      await this.context.commands.execute('git', [
        '-C', this.repositoryRoot!,
        'checkout', branch
      ]);
      
      this.currentBranch = branch;
      await this.updateStatus();
      
      this.context.ui.showNotification({
        type: 'success',
        message: `Switched to branch: ${branch}`,
      });
      
    } catch (error) {
      this.context.ui.showNotification({
        type: 'error',
        message: `Failed to checkout: ${error.message}`,
      });
    }
  }
  
  private watchGitDirectory() {
    if (!this.repositoryRoot) return;
    
    // Watch .git directory for changes
    this.watcherDispose = this.context.fs.watch(
      `${this.repositoryRoot}/.git`,
      async (event) => {
        // Debounce updates
        await this.updateStatus();
      }
    );
  }
  
  private async onFileSave(file: string) {
    // Update status when file is saved
    await this.updateStatus();
  }
  
  private async onFileOpen(file: string) {
    // Could show git blame info, last commit, etc.
  }
  
  private renderStatusPanel(status: GitStatus, files: any[]): string {
    // Returns HTML for the status panel
    return `
      <div class="git-status-panel">
        <div class="branch-info">
          <h3>${status.branch}</h3>
          ${status.ahead > 0 ? `<span>↑ ${status.ahead}</span>` : ''}
          ${status.behind > 0 ? `<span>↓ ${status.behind}</span>` : ''}
        </div>
        
        <div class="changes">
          <h4>Changes (${files.length})</h4>
          <ul>
            ${files.map(f => `
              <li class="file-${this.getStatusClass(f.status)}">
                <span class="status">${f.status}</span>
                <span class="path">${f.path}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
  }
  
  private getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'M ': 'modified',
      ' M': 'modified',
      'A ': 'added',
      'D ': 'deleted',
      '??': 'untracked',
      'UU': 'conflict',
    };
    return map[status] || 'unknown';
  }
}