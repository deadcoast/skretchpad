// src-tauri/js/plugin_api.js (injected into sandbox)
globalThis.skretchpad = {
    fs: {
      async readFile(path) {
        // Rust-side capability check
        return await Tauri.invoke('plugin_read_file', {
          pluginId: __PLUGIN_ID__,
          path: path,
        });
      },
      
      async writeFile(path, content) {
        return await Tauri.invoke('plugin_write_file', {
          pluginId: __PLUGIN_ID__,
          path: path,
          content: content,
        });
      },
    },
    
    network: {
      async fetch(url, options) {
        return await Tauri.invoke('plugin_fetch', {
          pluginId: __PLUGIN_ID__,
          url: url,
          options: options,
        });
      },
    },
    
    commands: {
      async execute(command, args) {
        return await Tauri.invoke('plugin_execute_command', {
          pluginId: __PLUGIN_ID__,
          command: command,
          args: args,
        });
      },
    },
  };