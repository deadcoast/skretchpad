<!-- plugins/git/components/StatusPanel.svelte -->
<script lang="ts">
    import type { GitStatus, FileChange } from '../types';
    
    export let status: GitStatus;
    export let files: FileChange[];
    export let onStage: (file: string) => void;
    export let onUnstage: (file: string) => void;
    export let onDiscard: (file: string) => void;
    export let onDiff: (file: string) => void;
    
    function getStatusIcon(status: string) {
      const icons = {
        'M': '$(diff-modified)',
        'A': '$(diff-added)',
        'D': '$(diff-removed)',
        '?': '$(question)',
        'U': '$(alert)',
      };
      return icons[status[0]] || '$(file)';
    }
    
    function getStatusColor(status: string) {
      const colors = {
        'M': 'text-yellow-500',
        'A': 'text-green-500',
        'D': 'text-red-500',
        '?': 'text-blue-500',
        'U': 'text-red-600',
      };
      return colors[status[0]] || 'text-gray-500';
    }
  </script>
  
  <div class="git-status-panel glass-panel">
    <!-- Branch info -->
    <div class="branch-header">
      <div class="branch-name">
        <span class="icon">$(git-branch)</span>
        <span class="text">{status.branch}</span>
      </div>
      
      <div class="sync-status">
        {#if status.ahead > 0}
          <span class="ahead">↑{status.ahead}</span>
        {/if}
        {#if status.behind > 0}
          <span class="behind">↓{status.behind}</span>
        {/if}
      </div>
    </div>
    
    <!-- Staged files -->
    {#if files.filter(f => f.staged).length > 0}
      <div class="file-group">
        <h4>Staged Changes ({files.filter(f => f.staged).length})</h4>
        <ul class="file-list">
          {#each files.filter(f => f.staged) as file}
            <li class="file-item">
              <span class="{getStatusIcon(file.status)} {getStatusColor(file.status)}">
                {getStatusIcon(file.status)}
              </span>
              <span class="file-path">{file.path}</span>
              <div class="file-actions">
                <button on:click={() => onDiff(file.path)} title="View diff">
                  $(diff)
                </button>
                <button on:click={() => onUnstage(file.path)} title="Unstage">
                  $(remove)
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <!-- Unstaged files -->
    {#if files.filter(f => !f.staged).length > 0}
      <div class="file-group">
        <h4>Changes ({files.filter(f => !f.staged).length})</h4>
        <ul class="file-list">
          {#each files.filter(f => !f.staged) as file}
            <li class="file-item">
              <span class="{getStatusIcon(file.status)} {getStatusColor(file.status)}">
                {getStatusIcon(file.status)}
              </span>
              <span class="file-path">{file.path}</span>
              <div class="file-actions">
                <button on:click={() => onDiff(file.path)} title="View diff">
                  $(diff)
                </button>
                <button on:click={() => onStage(file.path)} title="Stage">
                  $(add)
                </button>
                <button on:click={() => onDiscard(file.path)} title="Discard" class="danger">
                  $(trash)
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
  
  <style>
    .git-status-panel {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .branch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .branch-name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    
    .sync-status {
      display: flex;
      gap: 8px;
      font-size: 12px;
    }
    
    .ahead { color: var(--color-success); }
    .behind { color: var(--color-warning); }
    
    .file-group h4 {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
    
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      transition: background var(--transition-fast);
    }
    
    .file-item:hover {
      background: var(--hover-bg);
    }
    
    .file-path {
      flex: 1;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-actions {
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity var(--transition-fast);
    }
    
    .file-item:hover .file-actions {
      opacity: 1;
    }
    
    .file-actions button {
      padding: 4px 6px;
      background: transparent;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      transition: background var(--transition-fast);
    }
    
    .file-actions button:hover {
      background: var(--button-hover);
    }
    
    .file-actions button.danger:hover {
      background: var(--color-error);
      color: white;
    }
  </style>