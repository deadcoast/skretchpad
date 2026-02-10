# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Svelte 4 + TypeScript frontend (components, stores, utilities, styles).
- `src-tauri/`: Rust backend, plugin sandbox, Tauri commands, and native build config.
- `plugins/`: Local plugin packages (`plugin.toml`, `main.js`) loaded by the plugin system.
- `themes/`: Built-in TOML theme definitions.
- `docs/`: Architecture notes, plans, changelog, and user documentation.
- `src/test/`: Vitest setup and Tauri API mocks used by frontend tests.

## Build, Test, and Development Commands
- `npm run dev`: Start Vite frontend dev server.
- `npm run tauri:dev`: Run the desktop app with hot reload.
- `npm run build`: Build frontend assets into `dist/`.
- `npm run tauri:build`: Build production desktop binaries.
- `npm run check`: Run `svelte-check` + TypeScript validation.
- `npm run lint`: Lint `src/**/*.ts` and `src/**/*.svelte` with ESLint.
- `npm run test`, `npm run test:coverage`: Run Vitest (jsdom) with optional coverage.
- `npm run test:rust`: Run Rust tests in `src-tauri`.

## Coding Style & Naming Conventions
- Use Prettier defaults in `.prettierrc`: 2 spaces, single quotes, semicolons, trailing commas (`es5`), 100-char line width.
- Keep TypeScript and Svelte lint-clean (`.eslintrc.cjs`); prefix intentionally unused args with `_`.
- Name Svelte components in PascalCase (for example, `StatusBar.svelte`).
- Keep utility/store modules in lower camel or concise lowercase filenames (for example, `debounce.ts`, `theme.ts`).

## Testing Guidelines
- Frontend tests use Vitest + Testing Library with files matching `src/**/*.test.ts`.
- Coverage thresholds are enforced: 90% lines/functions/statements, 80% branches.
- Use `src/test/mocks/*` for Tauri APIs instead of hitting native APIs directly.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `fix: ...`, `feat: ...`.
- Keep commits scoped and atomic; include affected area when helpful (for example, `fix: plugin loader race`).
- For PRs, include: summary, linked issue, test evidence (`npm run test:coverage`, `npm run test:rust`), and screenshots/GIFs for UI changes.
- Ensure CI parity before review: lint, type-check, frontend coverage, Rust fmt/clippy/tests, and build checks.
