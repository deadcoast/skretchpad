# main.ts Architecture

> **Source File**: [`src/main.ts`](../../../src/main.ts)
> **Status**: ✅ Implemented
> **Component Type**: Frontend Application Bootstrap
> **Lines of Code**: 8

---

## Overview

`main.ts` is the entry point for the Svelte frontend application. It instantiates the root `App.svelte` component and mounts it to the DOM.

### Key Responsibilities

- **Application Bootstrap**: Creates Svelte app instance
- **DOM Mounting**: Attaches app to `#app` element in HTML
- **Export**: Exports app instance for potential external access

---

## Source Code

```typescript
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

**Complete file**: Lines 1-8

---

## Implementation Details

### App Instantiation

```typescript
const app = new App({
  target: document.getElementById('app')!,
});
```

- **Import**: Imports root [`App.svelte`](./0_App.svelte.md) component
- **Target**: Mounts to `#app` DOM element (defined in `index.html`)
- **Non-null assertion**: Uses `!` operator assuming element exists

### Export

```typescript
export default app;
```

Exports the Svelte app instance, allowing:
- Hot module replacement (HMR) in development
- Programmatic access to app instance if needed
- Vite development server integration

---

## HTML Integration

The `#app` element is defined in the project's HTML file (typically `index.html`):

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skretchpad</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

---

## Build Process

### Development

```bash
npm run dev
```

- Vite dev server loads `main.ts`
- Hot Module Replacement (HMR) enabled
- Svelte compiler processes `App.svelte`

### Production

```bash
npm run build
```

- Vite bundles `main.ts` and all dependencies
- Svelte compiler optimizes components
- Output to `dist/` directory

---

## Related Documentation

### Component Documentation

- **[App.svelte](./0_App.svelte.md)** - Root application component

### Configuration

- **[vite.config.ts](../4_configs.md#vite-configuration)** - Vite bundler configuration
- **[svelte.config.js](../4_configs.md#svelte-configuration)** - Svelte compiler configuration
- **[tsconfig.json](../4_configs.md#typescript-configuration)** - TypeScript configuration

### Project Status

- **[Tech Stack](../2_techstack.md)** - Frontend technologies (Svelte, Vite, TypeScript)
- **[STATUS.md](../../STATUS.md)** - Development progress

---

## Notes

### Simple by Design

This file is intentionally minimal. All application logic resides in:
- **Components**: [`src/components/`](../../../src/components/)
- **Stores**: [`src/lib/stores/`](../../../src/lib/stores/)
- **Utilities**: [`src/lib/`](../../../src/lib/)

### Tauri Integration

While `main.ts` doesn't directly reference Tauri, the Svelte app it bootstraps uses Tauri APIs via:
- `@tauri-apps/api/core` - `invoke()` for backend commands
- `@tauri-apps/api/event` - `listen()` for event subscriptions

See [`Editor.svelte`](./2_Editor.svelte.md) for Tauri integration examples.

---

**Documentation Version**: 1.0.0
**Component Version**: 0.1.0
**Accuracy**: Verified against source code 2025-10-28

---

## Documentation Correction Note

The existing file **`4_main.ts.md`** incorrectly documents `plugins/git/main.ts` (the Git plugin), not `src/main.ts` (this file). That documentation should be renamed to `git-plugin-main.ts.md` or similar.
