# OSV-Scanner

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Guide to using the OSV-Scanner tool with CodeRabbit's AI code reviews.

[OSV-Scanner](https://github.com/google/osv-scanner) is Google's vulnerability scanner that identifies vulnerabilities in your project's dependencies using the [OSV.dev](https://osv.dev) database.

## Files

OSV-Scanner scans the following manifest and lock files:

- `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `requirements.txt`, `Pipfile.lock`, `poetry.lock`, `pdm.lock`, `uv.lock`
- `go.mod`
- `pom.xml`, `build.gradle`, `buildscript-gradle.lockfile`, `gradle.lockfile`
- `Gemfile.lock`
- `composer.lock`
- `Cargo.toml`, `Cargo.lock`
- `pubspec.yaml`, `pubspec.lock`
- `mix.lock`
- `renv.lock`
- `cabal.project.freeze`, `stack.yaml.lock`
- `conan.lock`
- `deps.json`
- `packages.lock.json`, `packages.config`
- `bom.json`, `bom.xml`, `spdx.json`, `cdx.json` (SBOMs)

## Configuration

OSV-Scanner requires an `osv-scanner.toml` configuration file to run.

<Note>
  CodeRabbit will only run OSV-Scanner if your repository contains an `osv-scanner.toml` configuration file.
</Note>

## Notes

- OSV-Scanner scans dependency manifest and lock files to identify known vulnerabilities.
- Findings include vulnerability severity scores and details from the OSV.dev database.

## Links

- [OSV-Scanner GitHub Repository](https://github.com/google/osv-scanner)
- [OSV-Scanner Documentation](https://google.github.io/osv-scanner/)
- [OSV.dev Database](https://osv.dev)
