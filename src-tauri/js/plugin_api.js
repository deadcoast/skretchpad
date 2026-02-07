// src-tauri/js/plugin_api.js (injected into deno_core sandbox)
//
// This API is available to plugins running in the V8 sandbox.
// Since deno_core doesn't have Tauri IPC, API calls use a request queue
// that the worker thread processes via Rust ops.
// For now, calls log and return stubs until proper deno_core ops are wired.

// Hook registration system
globalThis.__hooks__ = {};

// Plugin lifecycle registration
globalThis.registerHook = function(hookName, handler) {
  globalThis.__hooks__[hookName] = handler;
};

// Convenience aliases for common hooks
globalThis.onActivate = function(handler) {
  globalThis.__hooks__.activate = handler;
};

globalThis.onDeactivate = function(handler) {
  globalThis.__hooks__.deactivate = handler;
};

// Request queue for async operations (processed by worker thread)
globalThis.__pendingRequests__ = [];
let __requestId__ = 0;

function __queueRequest__(method, params) {
  const id = ++__requestId__;
  const request = { id, method, params, pluginId: globalThis.__PLUGIN_ID__ };
  globalThis.__pendingRequests__.push(request);
  // In the current implementation, requests are processed synchronously
  // and results are not yet returned. This will be enhanced with deno_core ops.
  return null;
}

// Plugin API
globalThis.skretchpad = {
  fs: {
    async readFile(path) {
      return __queueRequest__('plugin_read_file', { path });
    },

    async writeFile(path, content) {
      return __queueRequest__('plugin_write_file', { path, content });
    },

    async listFiles(directory) {
      return __queueRequest__('plugin_list_files', { directory });
    },
  },

  network: {
    async fetch(url, options) {
      return __queueRequest__('plugin_fetch', { url, options });
    },
  },

  commands: {
    async execute(command, args) {
      return __queueRequest__('plugin_execute_command', { command, args });
    },
  },

  ui: {
    async showNotification(message, level) {
      return __queueRequest__('plugin_show_notification', { message, level });
    },

    async setStatusBarItem(id, text, tooltip) {
      return __queueRequest__('plugin_set_status_bar', { id, text, tooltip });
    },
  },

  editor: {
    async getActiveFile() {
      return __queueRequest__('plugin_get_active_file', {});
    },

    async getContent() {
      return __queueRequest__('plugin_get_editor_content', {});
    },
  },
};
