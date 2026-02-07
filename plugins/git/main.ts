// plugins/git/main.ts
// Git integration plugin for skretchpad
// Runs in deno_core V8 sandbox — uses globalThis.skretchpad API

// Register activation hook
onActivate(async () => {
  // Set status bar with current branch info
  skretchpad.ui.setStatusBarItem('git-branch', '$(git-branch) main', 'Git branch');

  // Try to get current branch via git command
  try {
    const result = await skretchpad.commands.execute('git', ['branch', '--show-current']);
    if (result) {
      skretchpad.ui.setStatusBarItem('git-branch', `$(git-branch) ${result}`, 'Current git branch');
    }
  } catch (e) {
    // Not a git repository or git not available
    skretchpad.ui.setStatusBarItem('git-branch', '$(git-branch) No repo', 'Not a git repository');
  }
});

// Register deactivation hook
onDeactivate(() => {
  // Cleanup handled by sandbox teardown
});

// Register hooks for file events
registerHook('on_file_save', async () => {
  // Update git status when a file is saved
  try {
    const result = await skretchpad.commands.execute('git', ['status', '--porcelain']);
    if (result) {
      const lines = (result as string).split('\n').filter((l: string) => l.trim());
      const changes = lines.length;
      if (changes > 0) {
        skretchpad.ui.setStatusBarItem('git-changes', `$(diff) ${changes}`, `${changes} changed files`);
      }
    }
  } catch (e) {
    // Silently ignore if git is not available
  }
});

registerHook('on_file_open', async () => {
  // Could show git blame info in the future
});
