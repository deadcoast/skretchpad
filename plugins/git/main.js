// plugins/git/main.js
// Git integration plugin for skretchpad
// Runs in deno_core V8 sandbox — uses globalThis.skretchpad API

// Register activation hook
onActivate(function () {
  // Set status bar with current branch info
  skretchpad.ui.setStatusBarItem('git-branch', 'git: main', 'Git branch');

  // Try to get current branch via git command
  try {
    var result = skretchpad.commands.execute('git', ['branch', '--show-current']);
    if (result && result.stdout) {
      var branch = result.stdout.trim();
      if (branch) {
        skretchpad.ui.setStatusBarItem('git-branch', 'git: ' + branch, 'Current git branch');
      }
    }
  } catch (e) {
    // Not a git repository or git not available
    skretchpad.ui.setStatusBarItem('git-branch', 'git: N/A', 'Not a git repository');
  }
});

// Register deactivation hook
onDeactivate(function () {
  // Cleanup handled by sandbox teardown
});

// Register hooks for file events
registerHook('on_file_save', function () {
  // Update git status when a file is saved
  try {
    var result = skretchpad.commands.execute('git', ['status', '--porcelain']);
    if (result && result.stdout) {
      var lines = result.stdout.split('\n').filter(function (l) { return l.trim(); });
      var changes = lines.length;
      if (changes > 0) {
        skretchpad.ui.setStatusBarItem('git-changes', 'changes: ' + changes, changes + ' changed files');
      }
    }
  } catch (e) {
    // Silently ignore if git is not available
  }
});

registerHook('on_file_open', function () {
  // Could show git blame info in the future
});
