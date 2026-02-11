# HTMLHint

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to HTMLHint.

[HTMLHint](https://htmlhint.com/) is a static code analysis tool for HTML.

## Files

HTMLHint will run checks against `*.html` files.

## Configuration

HTMLHint supports the following config files:

- `.htmlhintrc`
- `.htmlhintrc.json`
- `htmlhintrc.json`

CodeRabbit will use the default settings based on the profile selected if no config file is found.

## When we skip HTMLHint

CodeRabbit will skip running HTMLHint when:

- HTMLHint is already running in GitHub workflows.

## Profile behavior

In **Chill** mode, HTMLHint filters out the following categories:

- `attr-lowercase` - attribute names must be lowercase
- `attr-value-double-quotes` - attribute values must use double quotes

In **Assertive** mode, all findings are reported.

## Links

- [HTMLHint Configuration](https://htmlhint.com/getting-started/)
