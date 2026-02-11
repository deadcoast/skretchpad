# Biome

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Biome.

[Biome](https://biomejs.dev/) is a linter for JavaScript, TypeScript, JSX, TSX, JSON, JSONC, CSS.

## Files

Biome will run on files with the following extensions:

- `.js`
- `.ts`
- `.cjs`
- `.mjs`
- `.d.cts`
- `.d.mts`
- `.jsx`
- `.tsx`
- `.json`
- `.jsonc`
- `.css`

## Configuration

Biome supports the following config files:

- `biome.jsonc`
- `biome.json`

CodeRabbit will use the default settings based on the profile selected if no config file is found.

## When we skip Biome

CodeRabbit will skip running Biome when:

- Biome is already running in GitHub workflows.
- The config file schema version is greater than the Biome version used by CodeRabbit.

## Notes

- Files in `node_modules/` directories are automatically excluded. We do not run biome against submodule files.
- Biome configuration is validated against the schema version; if the config uses a newer schema version than the installed Biome version, the tool will be skipped.

## Links

- [Biome Configuration](https://biomejs.dev/reference/configuration/)
