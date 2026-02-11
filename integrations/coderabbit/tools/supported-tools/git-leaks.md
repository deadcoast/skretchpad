# Gitleaks

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Gitleaks.

[Gitleaks](https://gitleaks.io/) is a secret-scanner.

## Files

Gitleaks will run on all files.

## Configuration

Gitleaks supports the following config files:

- `gitleaks.toml`

## When we skip Gitleaks

CodeRabbit will skip running Gitleaks when:

- Gitleaks is already running in GitHub workflows.

## Notes

- Gitleaks runs on all files in the pull request (not just specific file types).
- Gitleaks uses `--no-git` flag, so it scans files directly rather than scanning git history.

## Links

- [Gitleaks Configuration](https://github.com/gitleaks/gitleaks#configuration)
