# Clippy

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit's guide to Clippy.

[Clippy](https://github.com/rust-lang/rust-clippy) is a collection of lints to catch common mistakes and improve your Rust code. It is the official linter for the Rust programming language.

## Supported Files

Clippy will run on files with the following extensions:

- `*.rs`

## Configuration

Clippy supports the following configuration files:

- `clippy.toml`
- `.clippy.toml`

<Note>
  Clippy does not require configuration to run. If no configuration file is found, it will use default settings.

A Cargo.toml is required.
</Note>

## When we skip Clippy

CodeRabbit will skip running Clippy when:

- No Rust files (`.rs`) are found in the pull request.
- No `Cargo.toml` file is found in the repository.
- Clippy is already running in GitHub workflows.

## Features

Clippy can detect many code quality issues such as:

- Style violations
- Common mistakes
- Performance issues
- Deprecated code patterns
- And many more Rust-specific issues

## Links

- [Clippy GitHub Repository](https://github.com/rust-lang/rust-clippy)
- [Clippy Documentation](https://rust-lang.github.io/rust-clippy/master/)
- [Available Lints](https://rust-lang.github.io/rust-clippy/master/index.html)
