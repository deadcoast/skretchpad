# 2. Configuration Files Required

## Rust Configuration

### `src-tauri/Cargo.toml`

Path: `/src-tauri/Cargo.toml`  
Purpose: Rust package manifest - defines dependencies, metadata, and build settings

```toml
[package]
name = "skretchpad"
version = "0.1.0"
description = "A minimal, modern skratchpad text editor for developers"
authors = ["heat"]
license = "MIT"
repository = "https://github.com/yourusername/skretchpad"
edition = "2021"

# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = ["shell-open", "fs-read-file", "fs-write-file", "path-all", "window-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
toml = "0.8"
tokio = { version = "1", features = ["full"] }
palette = "0.7"  # Color manipulation
deno_core = "0.220"  # Plugin sandboxing
notify = "6.0"  # File system watching
walkdir = "2.4"  # Directory traversal
regex = "1.10"
thiserror = "1.0"
anyhow = "1.0"

[dependencies.tauri-plugin-fs]
version = "2.0"

[features]
# This feature is used for production builds or when a `--release` flag is passed during build.
default = ["custom-protocol"]
# This feature enables the custom protocol for production builds
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"   # Strip expensive panic clean-up logic
codegen-units = 1 # Compile crates one after another for better optimization
lto = true        # Enable link-time optimization
opt-level = "s"   # Optimize for binary size
strip = true      # Remove debug symbols
```

### `src-tauri/tauri.conf.json`

Path: `/src-tauri/tauri.conf.json`  
Purpose: Tauri-specific configuration (window settings, permissions, build options)

```json
{
  "$schema": "https://schema.tauri.app/config/2.0.0",
  "productName": "skretchpad",
  "version": "0.1.0",
  "identifier": "com.skretchpad.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage"],
    "icon": [
      "icons/icon.icns",
      "icons/icon.ico",
      "icons/icon.png"
    ],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    },
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.13",
      "exceptionDomain": ""
    }
  },
  "app": {
    "windows": [
      {
        "title": "skretchpad",
        "width": 1000,
        "height": 700,
        "minWidth": 600,
        "minHeight": 400,
        "resizable": true,
        "fullscreen": false,
        "decorations": true,
        "transparent": true,
        "alwaysOnTop": false,
        "contentProtected": false,
        "skipTaskbar": false,
        "theme": "Dark",
        "titleBarStyle": "Overlay",
        "hiddenTitle": true,
        "acceptFirstMouse": true,
        "tabbingIdentifier": null
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:"
    }
  },
  "plugins": {
    "fs": {
      "scope": {
        "allow": ["$APPDATA/", "$HOME/"],
        "deny": []
      }
    }
  }
}
```

### `rust-toolchain.toml` (Optional but recommended)

Path: `/rust-toolchain.toml`  
Purpose: Pins Rust version for consistent builds

```toml
[toolchain]
channel = "stable"
components = ["rustfmt", "clippy"]
profile = "minimal"
```

---

## TypeScript Configuration

### `package.json`

Path: `/package.json`  
Purpose: npm dependencies, scripts, and project metadata

```json
{
  "name": "skretchpad",
  "version": "0.1.0",
  "type": "module",
  "description": "A minimal, modern text editor for developers",
  "author": "heat",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "check": "svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint src --ext .ts,.svelte",
    "format": "prettier --write \"src//*.{ts,svelte,css}\""
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "codemirror": "^6.0.1",
    "@codemirror/lang-python": "^6.1.3",
    "@codemirror/lang-rust": "^6.0.1",
    "@codemirror/lang-javascript": "^6.2.1",
    "@codemirror/lang-markdown": "^6.2.4",
    "@codemirror/lang-json": "^6.0.1",
    "@codemirror/lang-html": "^6.4.8",
    "@codemirror/lang-css": "^6.2.1",
    "@codemirror/state": "^6.4.0",
    "@codemirror/view": "^6.23.0",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/search": "^6.5.5",
    "nanostores": "^0.9.5"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "@tauri-apps/cli": "^2.0.0",
    "@tsconfig/svelte": "^5.0.2",
    "@types/node": "^20.11.5",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-plugin-svelte": "^2.35.1",
    "postcss": "^8.4.33",
    "prettier": "^3.2.4",
    "prettier-plugin-svelte": "^3.1.2",
    "svelte": "^4.2.8",
    "svelte-check": "^3.6.3",
    "tailwindcss": "^3.4.1",
    "tslib": "^2.6.2",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

### `tsconfig.json`

Path: `/tsconfig.json`  
Purpose: TypeScript compiler configuration for source code

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src//*.ts", "src//*.svelte"],
  "exclude": ["node_modules", "dist", "src-tauri"]
}
```

### `tsconfig.node.json`

Path: `/tsconfig.node.json`  
Purpose: TypeScript config for Node.js scripts (Vite config, etc.)

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

---

## Svelte Configuration

### `svelte.config.js`

Path: `/svelte.config.js`  
Purpose: Svelte compiler configuration

```javascript
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
  // for more information about preprocessors
  preprocess: vitePreprocess(),
  
  compilerOptions: {
    // Enable run-time checks when not in production
    dev: process.env.NODE_ENV !== 'production',
  },
  
  // Emit CSS for SSR when needed
  emitCss: true,
  
  // Hot module replacement options
  hot: {
    preserveLocalState: true,
    noPreserveStateKey: '@!hmr',
    optimistic: false,
  },
};
```

---

## Vite Configuration

### `vite.config.ts`

Path: `/vite.config.ts`  
Purpose: Vite bundler configuration (dev server, build settings)

```typescript
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  
  // Vite options tailored for Tauri
  clearScreen: false,
  
  server: {
    port: 5173,
    strictPort: true,
    // Tauri expects a fixed port, fail if occupied
    watch: {
      ignored: ['/src-tauri/'],
    },
  },
  
  // To make use of `TAURI_DEBUG` and other env variables
  envPrefix: ['VITE_', 'TAURI_'],
  
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM === 'windows' 
      ? 'chrome105' 
      : 'safari13',
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    // Output directory
    outDir: 'dist',
    // Rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          'codemirror': [
            'codemirror',
            '@codemirror/state',
            '@codemirror/view',
          ],
          'codemirror-langs': [
            '@codemirror/lang-python',
            '@codemirror/lang-rust',
            '@codemirror/lang-javascript',
            '@codemirror/lang-markdown',
          ],
        },
      },
    },
  },
});
```

---

## Linting & Formatting

### `.eslintrc.cjs`

Path: `/.eslintrc.cjs`  
Purpose: ESLint configuration for code quality

```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    extraFileExtensions: ['.svelte'],
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_' },
    ],
  },
};
```

### `.prettierrc`

Path: `/.prettierrc`  
Purpose: Code formatting rules

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
```

---

## Git Configuration

### `.gitignore`

Path: `/.gitignore`

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build outputs
dist/
target/
*.exe
*.dmg
*.app

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local

# Tauri
src-tauri/target/
src-tauri/Cargo.lock

# TypeScript
*.tsbuildinfo

# Temporary files
*.tmp
*.temp
```

---

## Summary Table

| Technology | Config File           | Path                         | Purpose                                         |
|------------|-----------------------|------------------------------|-------------------------------------------------|
| Rust       | `Cargo.toml`          | `/src-tauri/Cargo.toml`      | Dependencies & package metadata                 |
| Rust       | `Cargo.lock`          | `/src-tauri/Cargo.lock`      | Dependency lock file (auto-generated)           |
| Rust       | `rust-toolchain.toml` | `/rust-toolchain.toml`       | Rust version pinning (optional)                 |
| Tauri      | `tauri.conf.json`     | `/src-tauri/tauri.conf.json` | App configuration, permissions, window settings |
| TypeScript | `package.json`        | `/package.json`              | npm dependencies & scripts                      |
| TypeScript | `tsconfig.json`       | `/tsconfig.json`             | TypeScript compiler options                     |
| TypeScript | `tsconfig.node.json`  | `/tsconfig.node.json`        | TypeScript for Node scripts                     |
| Svelte     | `svelte.config.js`    | `/svelte.config.js`          | Svelte compiler configuration                   |
| Vite       | `vite.config.ts`      | `/vite.config.ts`            | Build tool & dev server config                  |
| ESLint     | `.eslintrc.cjs`       | `/.eslintrc.cjs`             | Linting rules                                   |
| Prettier   | `.prettierrc`         | `/.prettierrc`               | Code formatting rules                           |
| Git        | `.gitignore`          | `/.gitignore`                | Files to exclude from version control           |

---

## Quick Start Commands

```bash
# Initialize project
npm install          # Install JS dependencies
cd src-tauri && cargo build  # Build Rust backend

# Development
npm run tauri:dev    # Start dev server + Tauri app

# Build for production
npm run tauri:build  # Creates distributable packages

# Code quality
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run check        # Type-check with svelte-check
cargo clippy         # Rust linter (in src-tauri/)
```
