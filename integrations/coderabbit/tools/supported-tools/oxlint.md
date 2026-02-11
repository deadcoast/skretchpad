# Oxlint

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Oxlint.

[Oxlint](https://oxc.rs/docs/guide/usage/linter) is a blazingly fast JavaScript/TypeScript linter written in Rust that is 50-100x faster than ESLint.

## Supported Files

Oxlint will run on files with the following extensions:

- `.js`
- `.mjs`
- `.cjs`
- `.jsx`
- `.ts`
- `.mts`
- `.cts`
- `.tsx`
- `.vue`
- `.astro`
- `.svelte`

## Configuration

Oxlint supports the following configuration files:

- `.oxlintrc.json`
- `oxlintrc.json`
- `.oxlintrc`
- `oxlint.json`

<Note>
  If no Oxlint config file is found and Biome is enabled, CodeRabbit will use Biome instead as Oxlint functionality is included within Biome.

If Biome is not enabled or an Oxlint config file is found, CodeRabbit will use the Oxlint config to run.

Oxlint does not require configuration to run if Biome is disabled and Oxlint is enabled.
</Note>

## When we skip Oxlint

CodeRabbit will skip running Oxlint when:

- Oxlint is already running in GitHub workflows.
- No config file is found and Biome is enabled (Biome will be used instead).

## Links

- [Oxlint GitHub Repository](https://github.com/oxc-project/oxc/releases/)
- [Oxlint Website](https://oxc.rs/docs/guide/usage/linter)
