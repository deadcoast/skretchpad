# markdownlint

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further
>
> CodeRabbit's guide to markdownlint.

[`markdownlint-cli2`](https://github.com/DavidAnson/markdownlint) is a linter for Markdown.

## Files

Markdownlint will run on files with the following extensions:

- `.md`
- `.markdown`

## Configuration

`markdownlint-cli2` supports the following config files:

- `.markdownlint.jsonc`
- `.markdownlint.json`
- `.markdownlint.yaml`
- `.markdownlint.yml`

CodeRabbit will use the default settings based on the profile selected if no config file is found.

## When we skip markdownlint

CodeRabbit will skip running markdownlint when:

- markdownlint is already running in GitHub workflows.

## Ignored rules

The following markdownlint rules are automatically ignored:

- `MD004` - ul-style (disallows mixing of list markers)
- `MD012` - no-multiple-blanks (disallows multiple blank lines)
- `MD013` - line-length (enforces maximum line length)
- `MD025` - single-title, single-h1 (ensures only one H1 heading per file)
- `MD026` - no-trailing-punctuation (disallows trailing punctuation in headings)
- `MD032` - blanks-around-lists (disallows multiple blank lines around lists)
- `MD033` - no-inline-html (disallows inline HTML inside Markdown)

## Links

- [`markdownlint-cli2` Configuration](https://github.com/DavidAnson/markdownlint?tab=readme-ov-file#configuration)
