// src-tauri/js/plugin_api.js (injected into deno_core sandbox)
//
// This API is available to plugins running in the V8 sandbox.
// API calls use deno_core ops to execute actual Rust operations
// with capability validation enforced on the Rust side.

// Hook registration system
globalThis.__hooks__ = {};

// Plugin lifecycle registration
globalThis.registerHook = function (hookName, handler) {
  globalThis.__hooks__[hookName] = handler;
};

// Convenience aliases for common hooks
globalThis.onActivate = function (handler) {
  globalThis.__hooks__.activate = handler;
};

globalThis.onDeactivate = function (handler) {
  globalThis.__hooks__.deactivate = handler;
};

// Plugin API backed by deno_core ops
globalThis.skretchpad = {
  fs: {
    readFile(path) {
      try {
        return Deno.core.ops.op_plugin_read_file(path);
      } catch (e) {
        throw new Error(`fs.readFile: ${e?.message ?? e}`);
      }
    },

    writeFile(path, content) {
      try {
        Deno.core.ops.op_plugin_write_file(path, content);
      } catch (e) {
        throw new Error(`fs.writeFile: ${e?.message ?? e}`);
      }
    },

    listFiles(directory) {
      try {
        return Deno.core.ops.op_plugin_list_files(directory);
      } catch (e) {
        throw new Error(`fs.listFiles: ${e?.message ?? e}`);
      }
    },
  },

  network: {
    fetch(url, options) {
      try {
        return Deno.core.ops.op_plugin_fetch({
          url,
          method: options?.method,
          headers: options?.headers,
          body: options?.body,
        });
      } catch (e) {
        throw new Error(`network.fetch: ${e?.message ?? e}`);
      }
    },
  },

  commands: {
    execute(command, args) {
      try {
        return Deno.core.ops.op_plugin_execute_command(command, args || []);
      } catch (e) {
        throw new Error(`commands.execute: ${e?.message ?? e}`);
      }
    },
  },

  ui: {
    showNotification(message, level) {
      try {
        Deno.core.ops.op_plugin_show_notification(message, level || 'info');
      } catch (e) {
        throw new Error(`ui.showNotification: ${e?.message ?? e}`);
      }
    },

    setStatusBarItem(id, text, tooltip) {
      try {
        Deno.core.ops.op_plugin_set_status_bar(id, text, tooltip || '');
      } catch (e) {
        throw new Error(`ui.setStatusBarItem: ${e?.message ?? e}`);
      }
    },
  },

  editor: {
    getActiveFile() {
      try {
        return Deno.core.ops.op_plugin_get_active_file();
      } catch (e) {
        throw new Error(`editor.getActiveFile: ${e?.message ?? e}`);
      }
    },

    getContent() {
      try {
        return Deno.core.ops.op_plugin_get_editor_content();
      } catch (e) {
        throw new Error(`editor.getContent: ${e?.message ?? e}`);
      }
    },
  },
};
