// plugins/git-status/main.ts
// Lightweight git status display for skretchpad status bar
// Runs in deno_core V8 sandbox — uses globalThis.skretchpad API

onActivate(async () => {
  // Show a simple status indicator
  skretchpad.ui.setStatusBarItem('git-status', '$(git-branch) ...', 'Loading git status');

  try {
    const branch = await skretchpad.commands.execute('git', ['branch', '--show-current']);
    if (branch) {
      skretchpad.ui.setStatusBarItem('git-status', `$(git-branch) ${branch}`, 'Current branch');
    }
  } catch (e) {
    skretchpad.ui.setStatusBarItem('git-status', '$(git-branch) N/A', 'Git not available');
  }
});

onDeactivate(() => {
  // Cleanup handled by sandbox teardown
});
