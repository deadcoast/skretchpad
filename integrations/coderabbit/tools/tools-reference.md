# Tools Reference

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Complete reference for all CodeRabbit supported tools and their configuration options, organized by category.

<Info>
  This reference is automatically generated from the CodeRabbit tools schema.
  Last updated: 2026-02-06
</Info>

CodeRabbit supports integration with **44 static analysis tools**, linters, and security scanners. Each tool can be configured individually within your `.coderabbit.yaml` file.

<CardGroup cols={2}>
  <Card title="All Tools" icon="layers" href="#all-tools
    Browse all supported tools
  </Card>

  <Card title="Configuration Guide" icon="settings" href="/getting-started/yaml-configuration
    Learn configuration basics
  </Card>
</CardGroup>

## Example Configuration

```yaml .coderabbit.yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
reviews:
  tools:
    eslint:
      enabled: true
    gitleaks:
      enabled: true
```

## All Tools

> [!IMPORTANT]
> "Actionlint": "github"

Actionlint is a static checker for GitHub Actions workflow files.

> **Configuration Options:**
> "enabled" type="boolean"

Enable actionlint | is a static checker for GitHub Actions workflow files. | v1.7.10

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    actionlint:
        enabled: true
```
> [!IMPORTANT]
> "Ast-grep": "search"

Enable ast-grep | ast-grep is a code analysis tool that helps you to find patterns in your codebase using abstract syntax trees patterns. | v0.40.5

- **Configuration Options:**

> [!IMPORTANT]
> "rule_dirs": "array of string"

List of rules directories.

- Defaults to \`\`.

> [!IMPORTANT]
> "util_dirs: "array of string"

List of utils directories.

- Defaults to \`\`.

> [!IMPORTANT]
> "essential_rules": "boolean"

Use ast-grep essentials package.

- Defaults to `true`

> [!IMPORTANT]
> "packages" type="array of string
Predefined packages to be used.

- Defaults to \`\`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    ast-grep:
        enabled: true
```

> [!IMPORTANT]
> "Biome"
> Biome is a fast formatter, linter, and analyzer for web projects.

**Configuration Options:**
<!--ResponseField name="enabled" type="boolean"-->
Enable Biome | Biome is a fast formatter, linter, and analyzer for web projects. | Enable Biome integration. | v2.3.13

- Defaults to `true`

> **Example Configuration:**

```yaml
# theme={null}
reviews:
    tools:
    biome:
        enabled: true
```

> [!IMPORTANT]
> "Blinter": "tool"
> Blinter is a linter for Windows batch files that provides comprehensive static analysis to identify syntax errors, security vulnerabilities, performance issues, and style problems.

**Configuration Options:**

<!-- ResponseField name="enabled" type="boolean"-->
Enable Blinter | Blinter is a linter for Windows batch files that provides comprehensive static analysis to identify syntax errors, security vulnerabilities, performance issues, and style problems. | v1.0.112

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    blinter:
        enabled: true
```

> [!IMPORTANT]
>"Brakeman" icon="shield
Brakeman is a static analysis security vulnerability scanner for Ruby on Rails applications. | v8.0.1

**Configuration Options:**

> "enabled" type="boolean"

Enable Brakeman | Brakeman is a static analysis security vulnerability scanner for Ruby on Rails applications. | v8.0.1

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    brakeman:
        enabled: true
```

> [!IMPORTANT]
> "Buf": "package"

Buf offers linting for Protobuf files.

- **Configuration Options:**

> "enabled" type="boolean

Enable Buf | Buf offers linting for Protobuf files. | v1.64.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    buf:
        enabled: true
```

> [!IMPORTANT]
> "Checkmake": "hammer"

Checkmake is a linter for Makefiles.

- **Configuration Options:**

> "enabled" type="boolean"

Enable checkmake | checkmake is a linter for Makefiles. | v0.2.2

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    checkmake:
        enabled: true
```

> [!IMPORTANT]
>"Checkov" icon="cloud-security
Checkov is a static code analysis tool for infrastructure-as-code files.

**Configuration Options:**

> "enabled" type="boolean"

Enable Checkov | Checkov is a static code analysis tool for infrastructure-as-code files. | v3.2.334

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    checkov:
        enabled: true
```

> [!IMPORTANT]
>"Circleci" icon="circle
CircleCI tool is a static checker for CircleCI config files.

**Configuration Options:**

> "enabled" type="boolean

Enable CircleCI | CircleCI tool is a static checker for CircleCI config files. | v0.1.34038

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    circleci:
        enabled: true
```
> [!IMPORTANT]
>"Clang" icon="tool
Configuration for Clang to perform static analysis on C and C++ code

**Configuration Options:**

> "enabled" type="boolean

Enable Clang for C/C++ static analysis and code quality checks | v14.0.6

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    clang:
        enabled: true
```

> [!IMPORTANT]
>"Clippy" icon="rust
Clippy is a collection of lints to catch common mistakes and improve your Rust code.

**Configuration Options:**

> "enabled" type="boolean

Enable Clippy | Clippy is a collection of lints to catch common mistakes and improve your Rust code. | Enable Clippy integration.

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    clippy:
        enabled: true
```

> [!IMPORTANT]
>"Cppcheck" icon="code
Cppcheck is a static code analysis tool for the C and C++ programming languages.

**Configuration Options:**

> "enabled" type="boolean

Enable Cppcheck | Cppcheck is a static code analysis tool for the C and C++ programming languages. | v2.19.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    cppcheck:
        enabled: true
```

> [!IMPORTANT]
>"Detekt" icon="kotlin
Detekt is a static code analysis tool for Kotlin files.

**Configuration Options:**

> "enabled" type="boolean
Enable detekt | detekt is a static code analysis tool for Kotlin files. | v1.23.8

- Defaults to `true`

> "config_file" type="string

Optional path to the detekt configuration file relative to the repository.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    detekt:
        enabled: true
        config_file: "detekt.yml"
```

> [!IMPORTANT]
>"Dotenv Lint" icon="file-key
dotenv-linter is a tool for checking and fixing .env files for problems and best practices

**Configuration Options:**

> "enabled" type="boolean

Enable dotenv-linter | dotenv-linter is a tool for checking and fixing .env files for problems and best practices | v4.0.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    dotenvLint:
        enabled: true
```

> [!IMPORTANT]
>"Eslint" icon="code
ESLint is a static code analysis tool for JavaScript files.

**Configuration Options:**

> "enabled" type="boolean

Enable ESLint | ESLint is a static code analysis tool for JavaScript files.

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    eslint:
        enabled: true
```

> [!IMPORTANT]
>"Flake8" icon="snake
Flake8 is a Python linter that wraps PyFlakes, pycodestyle and Ned Batchelder's McCabe script.

**Configuration Options:**

> "enabled" type="boolean

Enable Flake8 | Flake8 is a Python linter that wraps PyFlakes, pycodestyle and Ned Batchelder's McCabe script. | v7.3.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    flake8:
        enabled: true
```

> [!IMPORTANT]
>"Fortitude Lint" icon="tool
Fortitude is a Fortran linter that checks for code quality and style issues.

**Configuration Options:**

> "enabled" type="boolean

Enable Fortitude | Fortitude is a Fortran linter that checks for code quality and style issues | v0.7.5

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    fortitudeLint:
        enabled: true
```

> [!IMPORTANT]
>"Github-checks" icon="github
GitHub Checks integration configuration.

**Configuration Options:**

> "enabled" type="boolean
Enable GitHub Checks
```
\| Enable integration, defaults to true
\| Enable GitHub Checks integration.
```
- Defaults to `true`

> "timeout_ms" type="number
Time in milliseconds to wait for all GitHub Checks to conclude. Default 90 seconds, max 15 minutes (900000ms).

- Defaults to `90000`.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    github-checks:
        enabled: true
```

> [!IMPORTANT]
>"Gitleaks" icon="key
Gitleaks is a secret scanner.

**Configuration Options:**

> "enabled" type="boolean

Enable Gitleaks | Gitleaks is a secret scanner. | Enable Gitleaks integration. | v8.30.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    gitleaks:
        enabled: true
```

> [!IMPORTANT]
>"Golangci-lint" icon="go
golangci-lint is a fast linters runner for Go.

**Configuration Options:**

> "enabled" type="boolean

Enable golangci-lint | golangci-lint is a fast linters runner for Go. | Enable golangci-lint integration. | v2.5.0

- Defaults to `true`

> "config_file" type="string

Optional path to the golangci-lint configuration file relative to the repository. Useful when the configuration file is named differently than the default '.golangci.yml', '.golangci.yaml', '.golangci.toml', '.golangci.json'.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    golangci-lint:
        enabled: true
        config_file: ".golangci.yml"
```

> [!IMPORTANT]
>"Hadolint" icon="docker
Hadolint is a Dockerfile linter.

**Configuration Options:**

> "enabled" type="boolean

Enable Hadolint | Hadolint is a Dockerfile linter. | Enable Hadolint integration. | v2.14.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    hadolint:
        enabled: true
```

> [!IMPORTANT]
>"Htmlhint" icon="code
HTMLHint is a static code analysis tool for HTML files.

**Configuration Options:**

> "enabled" type="boolean

Enable HTMLHint | HTMLHint is a static code analysis tool for HTML files. | Enable HTMLHint integration. | v1.8.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    htmlhint:
        enabled: true
```

> [!IMPORTANT]
>"Languagetool" icon="languages
LanguageTool is a style and grammar checker for 30+ languages.

**Configuration Options:**

> "enabled" type="boolean

Enable LanguageTool | Enable LanguageTool integration.

- Defaults to `true`

> "enabled_rules" type="array of string

IDs of rules to be enabled. The rule won't run unless 'level' is set to a level that activates the rule.

- Defaults to \`\`

> "disabled_rules" type="array of string

IDs of rules to be disabled. Note: EN\_UNPAIRED\_BRACKETS, and EN\_UNPAIRED\_QUOTES are always disabled.

- Defaults to \`\`

> "enabled_categories" type="array of string

IDs of categories to be enabled.

- Defaults to \`\`

> "disabled_categories" type="array of string

IDs of categories to be disabled. Note: TYPOS, TYPOGRAPHY, and CASING are always disabled.

- Defaults to \`\`.

> "enabled_only" type="boolean

Only the rules and categories whose IDs are specified with 'enabledRules' or 'enabledCategories' are enabled.

- Defaults to `false`.

> "level" type="enum

If set to 'picky', additional rules will be activated, i.e. rules that you might only find useful when checking formal text.

- One of: `default`, `picky`
- Defaults to `default`.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    languagetool:
        enabled: true
        level: "default"
```

> [!IMPORTANT]
>"Luacheck" icon="moon
Configuration for Lua code linting to ensure code quality

**Configuration Options:**

> "enabled" type="boolean

Enable Lua code linting | Luacheck helps maintain consistent and error-free Lua code | v1.2.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    luacheck:
        enabled: true
```

> [!IMPORTANT]
>"Markdownlint" icon="markdown
markdownlint-cli2 is a static analysis tool to enforce standards and consistency for Markdown files.

**Configuration Options:**

> "enabled" type="boolean

Enable markdownlint | markdownlint-cli2 is a static analysis tool to enforce standards and consistency for Markdown files. | Enable markdownlint integration. | v0.20.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    markdownlint:
        enabled: true
```

> [!IMPORTANT]
>"Osv Scanner" icon="tool
OSV Scanner is a tool for vulnerability package scanning.

**Configuration Options:**

> "enabled" type="boolean

Enable OSV Scanner | OSV Scanner is a tool for vulnerability package scanning | v2.3.2

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    osvScanner:
        enabled: true
```

> [!IMPORTANT]
>"Oxc" icon="zap
Oxlint is a JavaScript/TypeScript linter for OXC written in Rust.

**Configuration Options:**

> "enabled" type="boolean

Enable Oxlint | Oxlint is a JavaScript/TypeScript linter for OXC written in Rust. | v1.43.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    oxc:
        enabled: true
```

> [!IMPORTANT]
>"Phpcs" icon="php
PHP CodeSniffer is a PHP linter and coding standard checker.

**Configuration Options:**

> "enabled" type="boolean

Enable PHP CodeSniffer | PHP CodeSniffer is a PHP linter and coding standard checker. | v3.7.2

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    phpcs:
        enabled: true
```

> [!IMPORTANT]
>"Phpmd" icon="php
PHPMD is a tool to find potential problems in PHP code.

**Configuration Options:**

> "enabled" type="boolean

Enable PHPMD | PHPMD is a tool to find potential problems in PHP code. | v2.15.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    phpmd:
        enabled: true
```

> [!IMPORTANT]
>"Phpstan" icon="php
PHPStan is a tool to analyze PHP code.

**Configuration Options:**

> "enabled" type="boolean

Enable PHPStan | PHPStan requires [config file](https://phpstan.org/config-reference#config-file) in your repository root. Please ensure that this file contains the `paths:` parameter. | v2.1.38

- Defaults to `true`

> "level" type="enum

Level | Specify the [rule level](https://phpstan.org/user-guide/rule-levels) to run. This setting is ignored if your configuration file already has a `level:` parameter.

- One of: `default`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `max`
- Defaults to `default`.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    phpstan:
        enabled: true
        level: "default"
```

> [!IMPORTANT]
>"Pmd" icon="java
PMD is an extensible multilanguage static code analyzer. It’s mainly concerned with Java.

**Configuration Options:**

> "enabled" type="boolean

Enable PMD | PMD is an extensible multilanguage static code analyzer. It’s mainly concerned with Java. | v7.21.0

- Defaults to `true`

> "config_file" type="string

Optional path to the PMD configuration file relative to the repository.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    pmd:
        enabled: true
        config_file: "ruleset.xml"
```

> [!IMPORTANT]
>"Prisma Lint" icon="database
Configuration for Prisma Schema linting to ensure schema file quality

**Configuration Options:**

> "enabled" type="boolean

Enable Prisma Schema linting | Prisma Schema linting helps maintain consistent and error-free schema files | v0.13.1

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    prismaLint:
        enabled: true
```

> [!IMPORTANT]
>"Pylint" icon="snake
Pylint is a Python static code analysis tool.

**Configuration Options:**

> "enabled" type="boolean

Enable Pylint | Pylint is a Python static code analysis tool. | v4.0.4

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    pylint:
        enabled: true
```

> [!IMPORTANT]
>"Regal" icon="shield-check
Regal is a linter and language server for Rego.

**Configuration Options:**

> "enabled" type="boolean

Enable Regal | Regal is a linter and language server for Rego. | v0.38.1

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    regal:
        enabled: true
```

> [!IMPORTANT]
>"Rubocop" icon="gem
RuboCop is a Ruby static code analyzer (a.k.a. linter ) and code formatter.

**Configuration Options:**

> "enabled" type="boolean

Enable RuboCop | RuboCop is a Ruby static code analyzer (a.k.a. linter ) and code formatter. | v1.84.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    rubocop:
        enabled: true
```

> [!IMPORTANT]
>"Ruff" icon="snake
Ruff is a Python linter and code formatter.

**Configuration Options:**

> "enabled" type="boolean

Enable Ruff | Ruff is a Python linter and code formatter. |  Enable Ruff integration. | v0.14.14

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    ruff:
        enabled: true
```

> [!IMPORTANT]
>"Semgrep" icon="shield-alert
Semgrep is a static analysis tool designed to scan code for security vulnerabilities and code quality issues.

**Configuration Options:**

> "enabled" type="boolean

Enable Semgrep | Semgrep is a static analysis tool designed to scan code for security vulnerabilities and code quality issues. | Enable Semgrep integration. | v1.150.0

- Defaults to `true`

> "config_file" type="string

Optional path to the Semgrep configuration file relative to the repository.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    semgrep:
        enabled: true
        config_file: ".semgrep.yml"
```

> [!IMPORTANT]
>"Shellcheck" icon="terminal
ShellCheck is a static analysis tool that finds bugs in your shell scripts.

**Configuration Options:**

> "enabled" type="boolean

Enable ShellCheck | ShellCheck is a static analysis tool that finds bugs in your shell. | Enable ShellCheck integration. | v0.11.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    shellcheck:
        enabled: true
```

> [!IMPORTANT]
>"Shopify Theme Check" icon="shopping-bag
Configuration for Shopify Theme Check to ensure theme quality and best practices

**Configuration Options:**

> "enabled" type="boolean

Enable Shopify Theme Check | A linter for Shopify themes that helps you follow Shopify theme & Liquid best practices | cli 3.89.0 | theme 3.58.2

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    shopifyThemeCheck:
        enabled: true
```

> [!IMPORTANT]
>"Sqlfluff" icon="database
SQLFluff is an open source, dialect-flexible and configurable SQL linter.

**Configuration Options:**

> "enabled" type="boolean

Enable SQLFluff | SQLFluff is an open source, dialect-flexible and configurable SQL linter. | v4.0.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    sqlfluff:
        enabled: true
```

> [!IMPORTANT]
>"Swiftlint" icon="smartphone
SwiftLint integration configuration object.

**Configuration Options:**

> "enabled" type="boolean

Enable SwiftLint | SwiftLint is a Swift linter. | Enable SwiftLint integration. | v0.57.0

- Defaults to `true`

> "config_file" type="string

Optional path to the SwiftLint configuration file relative to the repository. This is useful when the configuration file is named differently than the default '.swiftlint.yml' or '.swiftlint.yaml'.

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    swiftlint:
        enabled: true
        config_file: ".swiftlint.yml"
```

> [!IMPORTANT]
>"Tflint" icon="tool
TFLint is a Terraform linter for finding potential errors and enforcing best practices.

**Configuration Options:**

> "enabled" type="boolean

Enable TFLint | TFLint is a Terraform linter for finding potential errors. | v0.60.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    tflint:
        enabled: true
```

> [!IMPORTANT]
>"Trivy" icon="tool
Trivy is a comprehensive security scanner that detects misconfigurations and secrets in Infrastructure as Code files

**Configuration Options:**

> "enabled" type="boolean

Enable Trivy for security scanning of IaC files (Terraform, Kubernetes, Docker, etc.) | v0.58.1

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    trivy:
        enabled: true
```

> [!IMPORTANT]
>"Yamllint" icon="file-code
YAMLlint is a linter for YAML files.

**Configuration Options:**

> "enabled" type="boolean

Enable YAMLlint | YAMLlint is a linter for YAML files. | Enable YAMLlint integration. | v1.38.0

- Defaults to `true`

> **Example Configuration:**

```yaml  theme={null}
reviews:
    tools:
    yamllint:
        enabled: true
```

</AccordionGroup>

## Related Resources

<CardGroup cols={3}>
<Card title="Configuration Reference" icon="settings" href="/reference/configuration
Complete configuration guide
</Card>

<Card title="Review Commands" icon="terminal" href="/reference/review-commands
Control reviews with commands
</Card>
</CardGroup>
