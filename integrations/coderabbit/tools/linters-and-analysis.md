# Linters & security analysis tools

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further
>
> Integrate 40+ third-party tools like ESLint, Ruff, and Gitleaks into CodeRabbit reviews for enhanced code quality and 1-click fixes.

CodeRabbit integrates with 40+ third-party linters and security analysis tools to enhance your code reviews. These tools run automatically in secure sandboxed environments, providing detailed feedback and 1-click fixes for common issues.

<Info>
  **Pro plan required** - This feature is available exclusively with CodeRabbit
  Pro. See our [pricing page](https://www.coderabbit.ai/pricing) for plan
  details.
</Info>

## Tool categories

<CardGroup cols={3}>
  <Card title="Code quality" icon="code" href="/tools/list">
    ESLint, Ruff, Pylint, SwiftLint, and 20+ more linters for code standards
  </Card>

  <Card title="Security analysis" icon="shield-check" href="/tools/list">
    Gitleaks, Semgrep, Checkov, and Brakeman for vulnerability detection
  </Card>

  <Card title="CI/CD integration" icon="cog" href="/tools/list">
    Pipeline remediation for GitHub Actions, CircleCI, and Azure DevOps
  </Card>
</CardGroup>

## Configuration methods

<Tabs>
  <Tab title="YAML configuration">
    Add tools to your repository's `.coderabbit.yaml` file:

    ```yaml YAML lines wrap icon="code" theme={null}
    reviews:
      profile: assertive
      tools:
        eslint:
          enabled: true
        ruff:
          enabled: true
          config_file: "pyproject.toml"
        gitleaks:
          enabled: true
    ```

  </Tab>

  <Tab title="Settings page">
    Configure tools through CodeRabbit's web interface:

    1. Navigate to **Review → Tools** in your settings
    2. Toggle individual tools on/off
    3. Set **Review → Profile** to `Chill` or `Assertive`
    4. Save changes to apply across all repositories

  </Tab>
</Tabs>

## Tool profiles

CodeRabbit offers two review profiles that control tool strictness:

- `Chill`: Focuses on critical issues and reduces noise from minor style violations
- `Assertive`: Provides comprehensive feedback including style and best practice suggestions

Each tool respects your existing configuration files (like `.eslintrc.js` or `pyproject.toml`) for maximum customization.

## Tool output and fixes

When tools detect issues, CodeRabbit displays structured output in the review comments:

    ```shell
    # lines wrap icon="code" theme={null}
    ESLint
    src/components/Button.tsx
    12-12: 'React' must be in scope when using JSX

    Add React import statement

    (react/react-in-jsx-scope)
    ```

Many tools provide 1-click fixes that CodeRabbit can apply directly to your pull request, streamlining the review process.

## Language support

Popular languages and their supported tools:

- **JavaScript/TypeScript**: Biome, ESLint, oxlint
- **Python**: Ruff, Pylint, Flake8
- **Go**: golangci-lint
- **Rust**: Clippy
- **Ruby**: RuboCop, Brakeman
- **Swift**: SwiftLint
- **PHP**: PHPStan, PHPMD, PHPCS

For the complete list of 40+ supported tools, see [supported tools](/tools/list).

## What's next

<CardGroup cols={2}>
  <Card title="Browse all tools" href="/tools/list">
    Complete list of linters, security tools, and CI/CD integrations
  </Card>

  <Card title="YAML configuration" href="/reference/configuration#reference">
    Full reference for .coderabbit.yaml configuration options
  </Card>
</CardGroup>
