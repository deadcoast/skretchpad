# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the Svelte UI. Feature code lives in `src/features/`, reusable widgets in `src/components/`, shared helpers in `src/lib/`. Store configs and themes sit in `src/configs/` and `src/styles/`.
- `src-tauri/` contains the Tauri Rust backend; focus updates here when native integrations or system APIs are involved.
- `plugins/` hosts built-in plugin descriptors, while `languages/` and `themes/` provide bundled assets for syntax highlighting and styling.
- Ship production artifacts build into `dist/`. Documentation lives under `Docs/`.

## Build, Test, and Development Commands
- `npm install` initializes dependencies (required after cloning or updating lockfiles).
- `npm run dev` launches the Vite dev server for the web UI.
- `npm run tauri:dev` starts the desktop shell with hot reload via Tauri.
- `npm run build` produces the optimized web bundle; pair with `npm run preview` to validate the output.
- `npm run tauri:build` generates installable desktop binaries.
- `npm run lint`, `npm run check`, and `npm run format` enforce ESLint, Svelte type checks, and Prettier formatting respectively.

## Coding Style & Naming Conventions
- Follow Prettier defaults: two-space indentation, single quotes in TypeScript, and trailing commas where valid.
- Component files use PascalCase (`SidebarPanel.svelte`); stores and utilities stay in camelCase (`useSettingsStore.ts`).
- Keep Svelte components focused: colocate component-specific styles and limit exported props to the minimal surface.
- Surface cross-cutting logic via stores under `src/lib/` to avoid duplicate state layers.

## Testing Guidelines
- No automated test suite exists yet; rely on `npm run lint` and `npm run check` for regression guards.
- For manual QA, run both `npm run dev` and `npm run tauri:dev` to confirm parity between browser and desktop surfaces.
- When adding tests, prefer Vitest with Svelte Testing Library stored under `src/__tests__/` and name files `ComponentName.test.ts`.

## Commit & Pull Request Guidelines
- Use imperative commit subjects (e.g., `Add plugin hot-reload guard`). Keep body lines wrapped at 72 characters to match the existing detailed history.
- Reference related issues or Docs pages in the body when altering shared configuration or plugin APIs.
- For pull requests, include a short problem statement, screenshots or GIFs for UI changes, and explicit testing notes (commands run, manual flows exercised).

## Agent Workflow Notes
- Cross-check plugin changes against `plugins/README` stubs and update generated schema docs in `Docs/` if contracts shift.
- When touching Rust code in `src-tauri/`, run `cargo fmt` and `cargo clippy` locally if available; attach outputs to PR discussions when fixes require follow-up.
