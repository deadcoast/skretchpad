// plugins/git-status/main.js
// Lightweight git status display for skretchpad status bar
// Runs in deno_core V8 sandbox — uses globalThis.skretchpad API

onActivate(function () {
  // Show a simple status indicator
  skretchpad.ui.setStatusBarItem('git-status', 'git: ...', 'Loading git status');

  try {
    var result = skretchpad.commands.execute('git', ['branch', '--show-current']);
    if (result?.stdout) {
      var branch = result.stdout.trim();
      if (branch) {
        skretchpad.ui.setStatusBarItem('git-status', 'git: ' + branch, 'Current branch');
      }
    }
  } catch (e) {
    skretchpad.ui.setStatusBarItem('git-status', 'git: N/A', 'Git not available');
  }
});

onDeactivate(function () {
  // Cleanup handled by sandbox teardown
});
