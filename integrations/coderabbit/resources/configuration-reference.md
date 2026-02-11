# Configuration reference

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Complete reference for CodeRabbit configuration options with detailed explanations, types, and examples.

<Info>
  This reference is automatically generated from the CodeRabbit configuration
  schema. Last updated: 2026-02-06
</Info>

CodeRabbit's behavior can be customized using a `.coderabbit.yaml` file in your repository root. This reference covers all available configuration options with clear property names and examples.

<CardGroup cols={2}>
  <Card title="Quick Start" icon="rocket" href="/getting-started/yaml-configuration">
    Get started with basic configuration
  </Card>

  <Card title="YAML config examples" icon="file-code" href="https://github.com/coderabbitai/awesome-coderabbit/tree/main/configs">
    Browse example configurations
  </Card>
</CardGroup>

## Configuration Sections

<CardGroup cols={2}>
  <Card title="General settings" icon="flag" href="#general-settings">
    Configure general settings
  </Card>

  <Card title="Code reviews" icon="git-pull-request" href="#reviews">
    Configure automatic code reviews, tools, and review behavior
  </Card>

  <Card title="Chat" icon="message-circle" href="#chat">
    Configure interactive chat features
  </Card>

  <Card title="Knowledge base" icon="brain" href="#knowledge-base">
    Configure knowledge base features
  </Card>

  <Card title="Code generation" icon="code" href="#code-generation">
    Configure code generation settings
  </Card>

  <Card title="Issue enrichment" icon="sparkles" href="#issue-enrichment">
    Configure automatic issue enrichment and planning
  </Card>
</CardGroup>

## General settings

### Reference

<ResponseField name="language" type="enum">
  Set the language for reviews by using the corresponding ISO language code.

  One of the following: `de`, `de-DE`, `de-AT`, `de-CH`, `en`, `en-US`, `en-AU`, `en-GB`, `en-CA`, `en-NZ`, `en-ZA`, `es`, `es-AR`, `fr`, `fr-CA`, `fr-CH`, `fr-BE`, `nl`, `nl-BE`, `pt-AO`, `pt`, `pt-BR`, `pt-MZ`, `pt-PT`, `ar`, `ast-ES`, `ast`, `be-BY`, `be`, `br-FR`, `br`, `ca-ES`, `ca`, `ca-ES-valencia`, `ca-ES-balear`, `da-DK`, `da`, `de-DE-x-simple-language`, `el-GR`, `el`, `eo`, `fa`, `ga-IE`, `ga`, `gl-ES`, `gl`, `it`, `ja-JP`, `ja`, `km-KH`, `km`, `ko-KR`, `ko`, `pl-PL`, `pl`, `ro-RO`, `ro`, `ru-RU`, `ru`, `sk-SK`, `sk`, `sl-SI`, `sl`, `sv`, `ta-IN`, `ta`, `tl-PH`, `tl`, `tr`, `uk-UA`, `uk`, `zh-CN`, `zh`, `crh-UA`, `crh`, `cs-CZ`, `cs`, `nb`, `no`, `nl-NL`, `de-DE-x-simple-language-DE`, `es-ES`, `it-IT`, `fa-IR`, `sv-SE`, `de-LU`, `fr-FR`, `bg-BG`, `bg`, `he-IL`, `he`, `hi-IN`, `hi`, `vi-VN`, `vi`, `th-TH`, `th`, `bn-BD`, `bn`

  Defaults to `"en-US"`.
</ResponseField>

<ResponseField name="tone_instructions" type="string">
  Set the tone of reviews and chat. Example: 'You must talk like Mr. T. I pity the fool who doesn't!'

  Defaults to `""`.

  <Note>Max length: 250</Note>
</ResponseField>

<ResponseField name="early_access" type="boolean">
  Enable early-access features.

  Defaults to `false`.
</ResponseField>

<ResponseField name="enable_free_tier" type="boolean">
  Enable free tier features for users not on a paid plan.

  Defaults to `true`.
</ResponseField>

## Reviews

Settings related to reviews.

### Reference

<ResponseField name="profile" type="enum">
  Set the review profile: `chill` for lighter feedback, `assertive` for more feedback (which may feel nitpicky).

  One of the following: `chill`, `assertive`

  Defaults to `"chill"`.
</ResponseField>

<ResponseField name="request_changes_workflow" type="boolean">
  Automatically approve once CodeRabbit’s comments are resolved and no pre-merge checks are failing. Note: In GitLab, all discussions must be resolved.

  Defaults to `false`.
</ResponseField>

<ResponseField name="high_level_summary" type="boolean">
  Generate a high-level summary of the changes in the PR description or walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="high_level_summary_instructions" type="string">
  By default, CodeRabbit generates release notes in the description. Use this to customize the summary content and format. Example: 'Create concise release notes as a bullet-point list, followed by a Markdown table showing lines added and removed by each contributing author.' Note: Use `high_level_summary_in_walkthrough` to place the summary in the walkthrough instead of the description.

  Defaults to `""`.
</ResponseField>

<ResponseField name="high_level_summary_placeholder" type="string">
  Placeholder in the PR description that CodeRabbit replaces with the high-level summary. If `high_level_summary` is false, the summary is still generated when this placeholder is present.

  Defaults to `"@coderabbitai summary"`.
</ResponseField>

<ResponseField name="high_level_summary_in_walkthrough" type="boolean">
  Include the high-level summary in the walkthrough comment.

  Defaults to `false`.
</ResponseField>

<ResponseField name="auto_title_placeholder" type="string">
  Add this keyword to the PR title to auto-generate a title.

  Defaults to `"@coderabbitai"`.
</ResponseField>

<ResponseField name="auto_title_instructions" type="string">
  Auto Title Instructions | Customize how CodeRabbit generates the PR title.

  Defaults to `""`.
</ResponseField>

<ResponseField name="review_status" type="boolean">
  Post review status messages (e.g., when a review is skipped) in the walkthrough summary comment.

  Defaults to `true`.
</ResponseField>

<ResponseField name="review_details" type="boolean">
  Post review details (ignored files, extra context used, suppressed comments, etc.).

  Defaults to `false`.
</ResponseField>

<ResponseField name="commit_status" type="boolean">
  Set the commit status to 'pending' when the review is in progress and 'success' when it is complete.

  Defaults to `true`.
</ResponseField>

<ResponseField name="fail_commit_status" type="boolean">
  Set the commit status to 'failure' when the PR cannot be reviewed by CodeRabbit for any reason.

  Defaults to `false`.
</ResponseField>

<ResponseField name="collapse_walkthrough" type="boolean">
  Wrap the walkthrough in a Markdown collapsible section.

  Defaults to `true`.
</ResponseField>

<ResponseField name="changed_files_summary" type="boolean">
  Include a summary of the changed files in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="sequence_diagrams" type="boolean">
  Include sequence diagrams in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="estimate_code_review_effort" type="boolean">
  Include an estimated code review effort in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="assess_linked_issues" type="boolean">
  Include an assessment of how well the changes address linked issues in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="related_issues" type="boolean">
  Include potentially related issues in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="related_prs" type="boolean">
  Related PRs | Include potentially related PRs in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="suggested_labels" type="boolean">
  Suggest labels based on the changes, and include them in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="labeling_instructions" type="array of object">
  Labeling Instructions | Define allowed labels and when to suggest them. When provided, CodeRabbit suggests only from this list (still informed by prior PRs); when empty, suggestions rely entirely on prior PRs.

  Defaults to `[]`.

  <Expandable title="Array Items">
    <ResponseField name="label" type="string">
      Label to suggest for the PR. Example: frontend
    </ResponseField>

    <ResponseField name="instructions" type="string">
      Instructions for the label. Example: Apply when the PR contains changes to React components.

      <Note>
        Max length: 3000
      </Note>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="auto_apply_labels" type="boolean">
  Automatically apply suggested labels to the PR.

  Defaults to `false`.
</ResponseField>

<ResponseField name="suggested_reviewers" type="boolean">
  Suggest reviewers based on the changes, and include them in the walkthrough.

  Defaults to `true`.
</ResponseField>

<ResponseField name="auto_assign_reviewers" type="boolean">
  Automatically assign the suggested reviewers to the PR.

  Defaults to `false`.
</ResponseField>

<ResponseField name="in_progress_fortune" type="boolean">
  Post a fortune message while the review is running.

  Defaults to `true`.
</ResponseField>

<ResponseField name="poem" type="boolean">
  Generate a poem in the walkthrough comment.

  Defaults to `true`.
</ResponseField>

<ResponseField name="enable_prompt_for_ai_agents" type="boolean">
  Prompt for AI Agents | Include the '🤖 Prompt for AI Agents' section in inline review comments to provide codegen instructions for AI agents.

  Defaults to `true`.
</ResponseField>

<ResponseField name="path_filters" type="array of string">
  Specify file patterns to include or exclude in a review using glob patterns (e.g., `!dist/**`, `src/**`). These patterns also apply to 'git sparse-checkout', including specified patterns and ignoring excluded ones (starting with '!') when cloning the repository.

  Defaults to `[]`.
</ResponseField>

<ResponseField name="path_instructions" type="array of object">
  Path Instructions | Add path-specific guidance for code review.

  Defaults to `[]`.

  <Expandable title="Array Items">
    <ResponseField name="path" type="string">
      File path glob pattern. Example: `**/*.js`.
    </ResponseField>

    <ResponseField name="instructions" type="string">
      Additional review guidance for matching paths.

      <Note>
        Max length: 20000
      </Note>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="abort_on_close" type="boolean">
  Abort the in-progress review if the PR is closed or merged.

  Defaults to `true`.
</ResponseField>

<ResponseField name="disable_cache" type="boolean">
  Disable caching of code and dependencies; fetch them fresh on each run.

  Defaults to `false`.
</ResponseField>

<ResponseField name="auto_review" type="object">
  Configuration for auto review

  Defaults to `{}`.

  <Expandable title="Auto review">
    <ResponseField name="enabled" type="boolean">
      Automatic Review | Review PRs automatically.

      Defaults to `true`.
    </ResponseField>

    <ResponseField name="description_keyword" type="string">
      Keyword in the PR description that triggers a review when automatic reviews are disabled. If `enabled` is false and this field is not empty, CodeRabbit reviews the PR only when this keyword is present in the description.

      Defaults to `""`.
    </ResponseField>

    <ResponseField name="auto_incremental_review" type="boolean">
      Incremental Review | Re-run the review on each push.

      Defaults to `true`.
    </ResponseField>

    <ResponseField name="ignore_title_keywords" type="array of string">
      Skip reviews when the PR title contains any of these keywords (case-insensitive).

      Defaults to `[]`.
    </ResponseField>

    <ResponseField name="labels" type="array of string">
      Labels that control which PRs are reviewed. Labels starting with '!' are negative matches. Examples: \['bug', 'feature'] reviews PRs with either label. \['!wip'] reviews all PRs except those labeled 'wip'. \['bug', '!wip'] reviews PRs labeled 'bug' but not 'wip'. This setting also triggers a review when `enabled` is false.

      Defaults to `[]`.
    </ResponseField>

    <ResponseField name="drafts" type="boolean">
      Include draft PRs.

      Defaults to `false`.
    </ResponseField>

    <ResponseField name="base_branches" type="array of string">
      Base branches (other than the default branch) to review. Accepts regex patterns. Use '.\*' to match all branches.

      Defaults to `[]`.
    </ResponseField>

    <ResponseField name="ignore_usernames" type="array of string">
      Skip reviews for PRs authored by these usernames (exact match; not email addresses).

      Defaults to `[]`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="finishing_touches" type="object">
  Configuration for finishing touches

  Defaults to `{}`.

  <Expandable title="Finishing touches">
    <ResponseField name="docstrings" type="object">
      Docstrings | Configure docstring generation.

      Defaults to `{}`.

      <Expandable title="Docstrings">
        <ResponseField name="enabled" type="boolean">
          Docstrings | Enable the docstrings finishing touch (trigger via the 📝 Generate docstrings checkbox or `@coderabbitai generate docstrings`). CodeRabbit generates or improves docstrings for functions changed in the PR and opens a follow-up PR containing the docstring edits.

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="unit_tests" type="object">
      Unit Tests | Configure unit test generation.

      Defaults to `{}`.

      <Expandable title="Unit tests">
        <ResponseField name="enabled" type="boolean">
          Unit Tests | Generate unit tests for changes in PRs.

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="pre_merge_checks" type="object">
  Configuration for pre merge checks

  Defaults to `{}`.

  <Expandable title="Pre merge checks">
    <ResponseField name="docstrings" type="object">
      Docstring Coverage | Check that docstring coverage meets the configured threshold.

      Defaults to `{}`.

      <Expandable title="Docstrings">
        <ResponseField name="mode" type="enum">
          Mode | Enforcement level: `off` disables the check, `warning` posts a warning, and `error` requires resolution before merging. If the request-changes workflow is enabled, `error` can block the PR until the check passes.

          One of the following: `off`, `warning`, `error`

          Defaults to `"warning"`.
        </ResponseField>

        <ResponseField name="threshold" type="number">
          Threshold | Minimum docstring coverage (%) required to pass.

          Defaults to `80`.

          <Note>
            Min: 0, Max: 100
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="title" type="object">
      Title Check | Validate the PR title against the requirements.

      Defaults to `{}`.

      <Expandable title="Title">
        <ResponseField name="mode" type="enum">
          Mode | Enforcement level: `off` disables the check, `warning` posts a warning, and `error` requires resolution before merging. If the request-changes workflow is enabled, `error` can block the PR until the check passes.

          One of the following: `off`, `warning`, `error`

          Defaults to `"warning"`.
        </ResponseField>

        <ResponseField name="requirements" type="string">
          Requirements | Describe title requirements. Example: 'Title should be concise and descriptive, ideally under 50 characters.'

          Defaults to `""`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="description" type="object">
      Description Check | Check that the PR description follows best practices.

      Defaults to `{}`.

      <Expandable title="Description">
        <ResponseField name="mode" type="enum">
          Mode | Enforcement level: `off` disables the check, `warning` posts a warning, and `error` requires resolution before merging. If the request-changes workflow is enabled, `error` can block the PR until the check passes.

          One of the following: `off`, `warning`, `error`

          Defaults to `"warning"`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="issue_assessment" type="object">
      Linked Issue Assessment | Assess how well the PR addresses linked issues.

      Defaults to `{}`.

      <Expandable title="Issue assessment">
        <ResponseField name="mode" type="enum">
          Mode | Enforcement level: `off` disables the check, `warning` posts a warning, and `error` requires resolution before merging. If the request-changes workflow is enabled, `error` can block the PR until the check passes.

          One of the following: `off`, `warning`, `error`

          Defaults to `"warning"`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="custom_checks" type="array of object">
      Custom Pre-merge Checks | Define up to 5 custom checks that must pass before merging. Each check needs a unique name (≤50 chars) and deterministic instructions (≤10,000 chars).

      Defaults to `[]`.

      <Expandable title="Array Items">
        <ResponseField name="mode" type="enum">
          Mode | Enforcement level: `off` disables the check, `warning` posts a warning, and `error` requires resolution before merging. If the request-changes workflow is enabled, `error` can block the PR until the check passes.

          One of the following: `off`, `warning`, `error`

          Defaults to `"warning"`.
        </ResponseField>

        <ResponseField name="name" type="string">
          Name | Display name (max 50 characters).

          Defaults to `""`.

          <Note>
            Min length: 1, Max length: 50
          </Note>
        </ResponseField>

        <ResponseField name="instructions" type="string">
          Instructions | Deterministic pass/fail criteria (max 10,000 characters).

          Defaults to `""`.

          <Note>
            Min length: 1, Max length: 10000
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="tools" type="object">
  Tools that provide additional context to code reviews.

  Defaults to `{}`.

  <Expandable title="Tools">
    <ResponseField name="ast-grep" type="object">
      Enable ast-grep | ast-grep is a code analysis tool that helps you to find patterns in your codebase using abstract syntax trees patterns. | v0.40.5

      Defaults to `{}`.

      <Expandable title="Ast-grep">
        <ResponseField name="rule_dirs" type="array of string">
          List of rules directories.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="util_dirs" type="array of string">
          List of utils directories.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="essential_rules" type="boolean">
          Use ast-grep essentials package.

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="packages" type="array of string">
          Predefined packages to be used.

          Defaults to `[]`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="shellcheck" type="object">
      ShellCheck is a static analysis tool that finds bugs in your shell scripts.

      Defaults to `{}`.

      <Expandable title="Shellcheck">
        <ResponseField name="enabled" type="boolean">
          Enable ShellCheck | ShellCheck is a static analysis tool that finds bugs in your shell. | Enable ShellCheck integration. | v0.11.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="ruff" type="object">
      Ruff is a Python linter and code formatter.

      Defaults to `{}`.

      <Expandable title="Ruff">
        <ResponseField name="enabled" type="boolean">
          Enable Ruff | Ruff is a Python linter and code formatter. |  Enable Ruff integration. | v0.14.14

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="markdownlint" type="object">
      markdownlint-cli2 is a static analysis tool to enforce standards and consistency for Markdown files.

      Defaults to `{}`.

      <Expandable title="Markdownlint">
        <ResponseField name="enabled" type="boolean">
          Enable markdownlint | markdownlint-cli2 is a static analysis tool to enforce standards and consistency for Markdown files. | Enable markdownlint integration. | v0.20.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="github-checks" type="object">
      GitHub Checks integration configuration.

      Defaults to `{}`.

      <Expandable title="Github-checks">
        <ResponseField name="enabled" type="boolean">
          Enable GitHub Checks
          \| Enable integration, defaults to true
          \| Enable GitHub Checks integration.

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="timeout_ms" type="number">
          Time in milliseconds to wait for all GitHub Checks to conclude. Default 90 seconds, max 15 minutes (900000ms).

          Defaults to `90000`.

          <Note>
            Min: 0, Max: 900000
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="languagetool" type="object">
      LanguageTool is a style and grammar checker for 30+ languages.

      Defaults to `{}`.

      <Expandable title="Languagetool">
        <ResponseField name="enabled" type="boolean">
          Enable LanguageTool | Enable LanguageTool integration.

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="enabled_rules" type="array of string">
          IDs of rules to be enabled. The rule won't run unless 'level' is set to a level that activates the rule.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="disabled_rules" type="array of string">
          IDs of rules to be disabled. Note: EN\_UNPAIRED\_BRACKETS, and EN\_UNPAIRED\_QUOTES are always disabled.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="enabled_categories" type="array of string">
          IDs of categories to be enabled.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="disabled_categories" type="array of string">
          IDs of categories to be disabled. Note: TYPOS, TYPOGRAPHY, and CASING are always disabled.

          Defaults to `[]`.
        </ResponseField>

        <ResponseField name="enabled_only" type="boolean">
          Only the rules and categories whose IDs are specified with 'enabledRules' or 'enabledCategories' are enabled.

          Defaults to `false`.
        </ResponseField>

        <ResponseField name="level" type="enum">
          If set to 'picky', additional rules will be activated, i.e. rules that you might only find useful when checking formal text.

          One of the following: `default`, `picky`

          Defaults to `"default"`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="biome" type="object">
      Biome is a fast formatter, linter, and analyzer for web projects.

      Defaults to `{}`.

      <Expandable title="Biome">
        <ResponseField name="enabled" type="boolean">
          Enable Biome | Biome is a fast formatter, linter, and analyzer for web projects. | Enable Biome integration. | v2.3.13

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="hadolint" type="object">
      Hadolint is a Dockerfile linter.

      Defaults to `{}`.

      <Expandable title="Hadolint">
        <ResponseField name="enabled" type="boolean">
          Enable Hadolint | Hadolint is a Dockerfile linter. | Enable Hadolint integration. | v2.14.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="swiftlint" type="object">
      SwiftLint integration configuration object.

      Defaults to `{}`.

      <Expandable title="Swiftlint">
        <ResponseField name="enabled" type="boolean">
          Enable SwiftLint | SwiftLint is a Swift linter. | Enable SwiftLint integration. | v0.57.0

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="config_file" type="string">
          Optional path to the SwiftLint configuration file relative to the repository. This is useful when the configuration file is named differently than the default '.swiftlint.yml' or '.swiftlint.yaml'.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="phpstan" type="object">
      PHPStan is a tool to analyze PHP code.

      Defaults to `{}`.

      <Expandable title="Phpstan">
        <ResponseField name="enabled" type="boolean">
          Enable PHPStan | PHPStan requires [config file](https://phpstan.org/config-reference#config-file) in your repository root. Please ensure that this file contains the `paths:` parameter. | v2.1.38

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="level" type="enum">
          Level | Specify the [rule level](https://phpstan.org/user-guide/rule-levels) to run. This setting is ignored if your configuration file already has a `level:` parameter.

          One of the following: `default`, `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `max`

          Defaults to `"default"`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="phpmd" type="object">
      PHPMD is a tool to find potential problems in PHP code.

      Defaults to `{}`.

      <Expandable title="Phpmd">
        <ResponseField name="enabled" type="boolean">
          Enable PHPMD | PHPMD is a tool to find potential problems in PHP code. | v2.15.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="phpcs" type="object">
      PHP CodeSniffer is a PHP linter and coding standard checker.

      Defaults to `{}`.

      <Expandable title="Phpcs">
        <ResponseField name="enabled" type="boolean">
          Enable PHP CodeSniffer | PHP CodeSniffer is a PHP linter and coding standard checker. | v3.7.2

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="golangci-lint" type="object">
      golangci-lint is a fast linters runner for Go.

      Defaults to `{}`.

      <Expandable title="Golangci-lint">
        <ResponseField name="enabled" type="boolean">
          Enable golangci-lint | golangci-lint is a fast linters runner for Go. | Enable golangci-lint integration. | v2.5.0

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="config_file" type="string">
          Optional path to the golangci-lint configuration file relative to the repository. Useful when the configuration file is named differently than the default '.golangci.yml', '.golangci.yaml', '.golangci.toml', '.golangci.json'.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="yamllint" type="object">
      YAMLlint is a linter for YAML files.

      Defaults to `{}`.

      <Expandable title="Yamllint">
        <ResponseField name="enabled" type="boolean">
          Enable YAMLlint | YAMLlint is a linter for YAML files. | Enable YAMLlint integration. | v1.38.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="gitleaks" type="object">
      Gitleaks is a secret scanner.

      Defaults to `{}`.

      <Expandable title="Gitleaks">
        <ResponseField name="enabled" type="boolean">
          Enable Gitleaks | Gitleaks is a secret scanner. | Enable Gitleaks integration. | v8.30.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="checkov" type="object">
      Checkov is a static code analysis tool for infrastructure-as-code files.

      Defaults to `{}`.

      <Expandable title="Checkov">
        <ResponseField name="enabled" type="boolean">
          Enable Checkov | Checkov is a static code analysis tool for infrastructure-as-code files. | v3.2.334

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="tflint" type="object">
      TFLint is a Terraform linter for finding potential errors and enforcing best practices.

      Defaults to `{}`.

      <Expandable title="Tflint">
        <ResponseField name="enabled" type="boolean">
          Enable TFLint | TFLint is a Terraform linter for finding potential errors. | v0.60.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="trivy" type="object">
      Trivy is a comprehensive security scanner that detects misconfigurations and secrets in Infrastructure as Code files

      Defaults to `{}`.

      <Expandable title="Trivy">
        <ResponseField name="enabled" type="boolean">
          Enable Trivy for security scanning of IaC files (Terraform, Kubernetes, Docker, etc.) | v0.58.1

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="detekt" type="object">
      Detekt is a static code analysis tool for Kotlin files.

      Defaults to `{}`.

      <Expandable title="Detekt">
        <ResponseField name="enabled" type="boolean">
          Enable detekt | detekt is a static code analysis tool for Kotlin files. | v1.23.8

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="config_file" type="string">
          Optional path to the detekt configuration file relative to the repository.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="eslint" type="object">
      ESLint is a static code analysis tool for JavaScript files.

      Defaults to `{}`.

      <Expandable title="Eslint">
        <ResponseField name="enabled" type="boolean">
          Enable ESLint | ESLint is a static code analysis tool for JavaScript files.

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="flake8" type="object">
      Flake8 is a Python linter that wraps PyFlakes, pycodestyle and Ned Batchelder's McCabe script.

      Defaults to `{}`.

      <Expandable title="Flake8">
        <ResponseField name="enabled" type="boolean">
          Enable Flake8 | Flake8 is a Python linter that wraps PyFlakes, pycodestyle and Ned Batchelder's McCabe script. | v7.3.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="fortitudeLint" type="object">
      Fortitude is a Fortran linter that checks for code quality and style issues.

      Defaults to `{}`.

      <Expandable title="Fortitude Lint">
        <ResponseField name="enabled" type="boolean">
          Enable Fortitude | Fortitude is a Fortran linter that checks for code quality and style issues | v0.7.5

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="rubocop" type="object">
      RuboCop is a Ruby static code analyzer (a.k.a. linter ) and code formatter.

      Defaults to `{}`.

      <Expandable title="Rubocop">
        <ResponseField name="enabled" type="boolean">
          Enable RuboCop | RuboCop is a Ruby static code analyzer (a.k.a. linter ) and code formatter. | v1.84.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="buf" type="object">
      Buf offers linting for Protobuf files.

      Defaults to `{}`.

      <Expandable title="Buf">
        <ResponseField name="enabled" type="boolean">
          Enable Buf | Buf offers linting for Protobuf files. | v1.64.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="regal" type="object">
      Regal is a linter and language server for Rego.

      Defaults to `{}`.

      <Expandable title="Regal">
        <ResponseField name="enabled" type="boolean">
          Enable Regal | Regal is a linter and language server for Rego. | v0.38.1

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="actionlint" type="object">
      actionlint is a static checker for GitHub Actions workflow files.

      Defaults to `{}`.

      <Expandable title="Actionlint">
        <ResponseField name="enabled" type="boolean">
          Enable actionlint | is a static checker for GitHub Actions workflow files. | v1.7.10

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="pmd" type="object">
      PMD is an extensible multilanguage static code analyzer. It’s mainly concerned with Java.

      Defaults to `{}`.

      <Expandable title="Pmd">
        <ResponseField name="enabled" type="boolean">
          Enable PMD | PMD is an extensible multilanguage static code analyzer. It’s mainly concerned with Java. | v7.21.0

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="config_file" type="string">
          Optional path to the PMD configuration file relative to the repository.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="clang" type="object">
      Configuration for Clang to perform static analysis on C and C++ code

      Defaults to `{}`.

      <Expandable title="Clang">
        <ResponseField name="enabled" type="boolean">
          Enable Clang for C/C++ static analysis and code quality checks | v14.0.6

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="cppcheck" type="object">
      Cppcheck is a static code analysis tool for the C and C++ programming languages.

      Defaults to `{}`.

      <Expandable title="Cppcheck">
        <ResponseField name="enabled" type="boolean">
          Enable Cppcheck | Cppcheck is a static code analysis tool for the C and C++ programming languages. | v2.19.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="semgrep" type="object">
      Semgrep is a static analysis tool designed to scan code for security vulnerabilities and code quality issues.

      Defaults to `{}`.

      <Expandable title="Semgrep">
        <ResponseField name="enabled" type="boolean">
          Enable Semgrep | Semgrep is a static analysis tool designed to scan code for security vulnerabilities and code quality issues. | Enable Semgrep integration. | v1.150.0

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="config_file" type="string">
          Optional path to the Semgrep configuration file relative to the repository.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="circleci" type="object">
      CircleCI tool is a static checker for CircleCI config files.

      Defaults to `{}`.

      <Expandable title="Circleci">
        <ResponseField name="enabled" type="boolean">
          Enable CircleCI | CircleCI tool is a static checker for CircleCI config files. | v0.1.34038

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="clippy" type="object">
      Clippy is a collection of lints to catch common mistakes and improve your Rust code.

      Defaults to `{}`.

      <Expandable title="Clippy">
        <ResponseField name="enabled" type="boolean">
          Enable Clippy | Clippy is a collection of lints to catch common mistakes and improve your Rust code. | Enable Clippy integration.

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="sqlfluff" type="object">
      SQLFluff is an open source, dialect-flexible and configurable SQL linter.

      Defaults to `{}`.

      <Expandable title="Sqlfluff">
        <ResponseField name="enabled" type="boolean">
          Enable SQLFluff | SQLFluff is an open source, dialect-flexible and configurable SQL linter. | v4.0.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="prismaLint" type="object">
      Configuration for Prisma Schema linting to ensure schema file quality

      Defaults to `{}`.

      <Expandable title="Prisma Lint">
        <ResponseField name="enabled" type="boolean">
          Enable Prisma Schema linting | Prisma Schema linting helps maintain consistent and error-free schema files | v0.13.1

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="pylint" type="object">
      Pylint is a Python static code analysis tool.

      Defaults to `{}`.

      <Expandable title="Pylint">
        <ResponseField name="enabled" type="boolean">
          Enable Pylint | Pylint is a Python static code analysis tool. | v4.0.4

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="oxc" type="object">
      Oxlint is a JavaScript/TypeScript linter for OXC written in Rust.

      Defaults to `{}`.

      <Expandable title="Oxc">
        <ResponseField name="enabled" type="boolean">
          Enable Oxlint | Oxlint is a JavaScript/TypeScript linter for OXC written in Rust. | v1.43.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="shopifyThemeCheck" type="object">
      Configuration for Shopify Theme Check to ensure theme quality and best practices

      Defaults to `{}`.

      <Expandable title="Shopify Theme Check">
        <ResponseField name="enabled" type="boolean">
          Enable Shopify Theme Check | A linter for Shopify themes that helps you follow Shopify theme & Liquid best practices | cli 3.89.0 | theme 3.58.2

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="luacheck" type="object">
      Configuration for Lua code linting to ensure code quality

      Defaults to `{}`.

      <Expandable title="Luacheck">
        <ResponseField name="enabled" type="boolean">
          Enable Lua code linting | Luacheck helps maintain consistent and error-free Lua code | v1.2.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="brakeman" type="object">
      Brakeman is a static analysis security vulnerability scanner for Ruby on Rails applications. | v8.0.1

      Defaults to `{}`.

      <Expandable title="Brakeman">
        <ResponseField name="enabled" type="boolean">
          Enable Brakeman | Brakeman is a static analysis security vulnerability scanner for Ruby on Rails applications. | v8.0.1

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="dotenvLint" type="object">
      dotenv-linter is a tool for checking and fixing .env files for problems and best practices

      Defaults to `{}`.

      <Expandable title="Dotenv Lint">
        <ResponseField name="enabled" type="boolean">
          Enable dotenv-linter | dotenv-linter is a tool for checking and fixing .env files for problems and best practices | v4.0.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="htmlhint" type="object">
      HTMLHint is a static code analysis tool for HTML files.

      Defaults to `{}`.

      <Expandable title="Htmlhint">
        <ResponseField name="enabled" type="boolean">
          Enable HTMLHint | HTMLHint is a static code analysis tool for HTML files. | Enable HTMLHint integration. | v1.8.0

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="checkmake" type="object">
      checkmake is a linter for Makefiles.

      Defaults to `{}`.

      <Expandable title="Checkmake">
        <ResponseField name="enabled" type="boolean">
          Enable checkmake | checkmake is a linter for Makefiles. | v0.2.2

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="osvScanner" type="object">
      OSV Scanner is a tool for vulnerability package scanning.

      Defaults to `{}`.

      <Expandable title="Osv Scanner">
        <ResponseField name="enabled" type="boolean">
          Enable OSV Scanner | OSV Scanner is a tool for vulnerability package scanning | v2.3.2

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="blinter" type="object">
      Blinter is a linter for Windows batch files that provides comprehensive static analysis to identify syntax errors, security vulnerabilities, performance issues, and style problems.

      Defaults to `{}`.

      <Expandable title="Blinter">
        <ResponseField name="enabled" type="boolean">
          Enable Blinter | Blinter is a linter for Windows batch files that provides comprehensive static analysis to identify syntax errors, security vulnerabilities, performance issues, and style problems. | v1.0.112

          Defaults to `true`.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

## Chat

Configuration for chat

### Reference

<ResponseField name="art" type="boolean">
  Generate art in chat responses (ASCII or emoji).

  Defaults to `true`.
</ResponseField>

<ResponseField name="auto_reply" type="boolean">
  Let CodeRabbit reply automatically without requiring a mention/tag.

  Defaults to `true`.
</ResponseField>

<ResponseField name="integrations" type="object">
  Configuration for integrations

  Defaults to `{}`.

  <Expandable title="Integrations">
    <ResponseField name="jira" type="object">
      Configuration for jira

      Defaults to `{}`.

      <Expandable title="Jira">
        <ResponseField name="usage" type="enum">
          Jira | Allow creating Jira issues from chat. 'auto' disables the integration for public repositories.

          One of the following: `auto`, `enabled`, `disabled`

          Defaults to `"auto"`.
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="linear" type="object">
      Configuration for linear

      Defaults to `{}`.

      <Expandable title="Linear">
        <ResponseField name="usage" type="enum">
          Linear | Allow creating Linear issues from chat. 'auto' disables the integration for public repositories.

          One of the following: `auto`, `enabled`, `disabled`

          Defaults to `"auto"`.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

## Knowledge base

Configuration for knowledge base

### Reference

<ResponseField name="opt_out" type="boolean">
  Opt Out | Disable knowledge base features that require data retention. Opting out removes any existing stored knowledge base data.

  Defaults to `false`.
</ResponseField>

<ResponseField name="web_search" type="object">
  Configuration for web search

  Defaults to `{}`.

  <Expandable title="Web search">
    <ResponseField name="enabled" type="boolean">
      Web Search | Use web search to gather additional context.

      Defaults to `true`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="code_guidelines" type="object">
  Use your coding guideline documents (see File Patterns) as review criteria.

  Defaults to `{}`.

  <Expandable title="Code guidelines">
    <ResponseField name="enabled" type="boolean">
      Enabled | Apply your organization's coding standards during reviews.

      Defaults to `true`.
    </ResponseField>

    <ResponseField name="filePatterns" type="array of string">
      File Patterns | Patterns for your coding guideline documents. CodeRabbit scans these files to learn your standards and apply them during reviews. Multiple files supported; file names are case-sensitive. Defaults include: (\*\*/.cursorrules, .github/copilot-instructions.md, .github/instructions/*.instructions.md, \*\*/CLAUDE.md, \*\*/GEMINI.md, \*\*/.cursor/rules/*, \*\*/.windsurfrules, \*\*/.clinerules/*, \*\*/.rules/*, \*\*/AGENT.md, \*\*/AGENTS.md).

      Defaults to `[]`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="learnings" type="object">
  Configuration for learnings

  Defaults to `{}`.

  <Expandable title="Learnings">
    <ResponseField name="scope" type="enum">
      Learnings | Choose scope: 'local' (repo), 'global' (org), or 'auto' (local for public repos, global for private repos).

      One of the following: `local`, `global`, `auto`

      Defaults to `"auto"`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="issues" type="object">
  Configuration for issues

  Defaults to `{}`.

  <Expandable title="Issues">
    <ResponseField name="scope" type="enum">
      Issues | Choose scope for GitHub/GitLab issues: 'local' (repo), 'global' (org), or 'auto' (local for public repos, global for private repos).

      One of the following: `local`, `global`, `auto`

      Defaults to `"auto"`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="jira" type="object">
  Configuration for jira

  Defaults to `{}`.

  <Expandable title="Jira">
    <ResponseField name="usage" type="enum">
      Jira | Use Jira as a knowledge source. 'auto' disables the integration for public repositories.

      One of the following: `auto`, `enabled`, `disabled`

      Defaults to `"auto"`.
    </ResponseField>

    <ResponseField name="project_keys" type="array of string">
      Jira Project Keys | Restrict Jira context to these projects.

      Defaults to `[]`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="linear" type="object">
  Configuration for linear

  Defaults to `{}`.

  <Expandable title="Linear">
    <ResponseField name="usage" type="enum">
      Linear | Use Linear as a knowledge source. 'auto' disables the integration for public repositories.

      One of the following: `auto`, `enabled`, `disabled`

      Defaults to `"auto"`.
    </ResponseField>

    <ResponseField name="team_keys" type="array of string">
      Linear Team Keys | Restrict Linear context to these teams (e.g. 'ENG').

      Defaults to `[]`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="pull_requests" type="object">
  Configuration for pull requests

  Defaults to `{}`.

  <Expandable title="Pull requests">
    <ResponseField name="scope" type="enum">
      PRs | Choose scope: 'local' (repo), 'global' (org), or 'auto' (local for public repos, global for private repos).

      One of the following: `local`, `global`, `auto`

      Defaults to `"auto"`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="mcp" type="object">
  Configuration for mcp

  Defaults to `{}`.

  <Expandable title="Mcp">
    <ResponseField name="usage" type="enum">
      MCP | Use MCP servers as a knowledge source. 'auto' disables the integration for public repositories.

      One of the following: `auto`, `enabled`, `disabled`

      Defaults to `"auto"`.
    </ResponseField>

    <ResponseField name="disabled_servers" type="array of string">
      Disabled MCP Servers | Specify MCP server labels to disable (case-insensitive). These servers will be excluded from reviews and knowledge base queries.

      Defaults to `[]`.
    </ResponseField>
  </Expandable>
</ResponseField>

## Code generation

Configuration for code generation

### Reference

<ResponseField name="docstrings" type="object">
  Docstring Generation | Settings for generating docstrings.

  Defaults to `{"path_instructions":[]}`.

  <Expandable title="Docstrings">
    <ResponseField name="language" type="enum">
      Language for generated docstrings (ISO language code).

      One of the following: `de`, `de-DE`, `de-AT`, `de-CH`, `en`, `en-US`, `en-AU`, `en-GB`, `en-CA`, `en-NZ`, `en-ZA`, `es`, `es-AR`, `fr`, `fr-CA`, `fr-CH`, `fr-BE`, `nl`, `nl-BE`, `pt-AO`, `pt`, `pt-BR`, `pt-MZ`, `pt-PT`, `ar`, `ast-ES`, `ast`, `be-BY`, `be`, `br-FR`, `br`, `ca-ES`, `ca`, `ca-ES-valencia`, `ca-ES-balear`, `da-DK`, `da`, `de-DE-x-simple-language`, `el-GR`, `el`, `eo`, `fa`, `ga-IE`, `ga`, `gl-ES`, `gl`, `it`, `ja-JP`, `ja`, `km-KH`, `km`, `ko-KR`, `ko`, `pl-PL`, `pl`, `ro-RO`, `ro`, `ru-RU`, `ru`, `sk-SK`, `sk`, `sl-SI`, `sl`, `sv`, `ta-IN`, `ta`, `tl-PH`, `tl`, `tr`, `uk-UA`, `uk`, `zh-CN`, `zh`, `crh-UA`, `crh`, `cs-CZ`, `cs`, `nb`, `no`, `nl-NL`, `de-DE-x-simple-language-DE`, `es-ES`, `it-IT`, `fa-IR`, `sv-SE`, `de-LU`, `fr-FR`, `bg-BG`, `bg`, `he-IL`, `he`, `hi-IN`, `hi`, `vi-VN`, `vi`, `th-TH`, `th`, `bn-BD`, `bn`

      Defaults to `"en-US"`.
    </ResponseField>

    <ResponseField name="path_instructions" type="array of object">
      Path Instructions | Add path-specific guidelines for docstring generation.

      Defaults to `[]`.

      <Expandable title="Array Items">
        <ResponseField name="path" type="string">
          File path glob pattern. Example: `**/*.js`.
        </ResponseField>

        <ResponseField name="instructions" type="string">
          Additional docstring-generation guidelines for matching paths.

          <Note>
            Max length: 20000
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="unit_tests" type="object">
  Unit Test Generation | Settings for generating unit tests.

  Defaults to `{"path_instructions":[]}`.

  <Expandable title="Unit tests">
    <ResponseField name="path_instructions" type="array of object">
      Path Instructions | Add path-specific guidelines for unit test generation.

      Defaults to `[]`.

      <Expandable title="Array Items">
        <ResponseField name="path" type="string">
          File path glob pattern. Example: `**/*.js`.
        </ResponseField>

        <ResponseField name="instructions" type="string">
          Additional unit-test-generation guidelines for matching paths.

          <Note>
            Max length: 20000
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

## Issue enrichment

Configuration for issue enrichment

### Reference

<ResponseField name="auto_enrich" type="object">
  Settings for automatic issue enrichment.

  Defaults to `{}`.

  <Expandable title="Auto enrich">
    <ResponseField name="enabled" type="boolean">
      Automatic Issue Enrichment | Analyze and enrich issues with additional context (related code, potential solutions, complexity assessment).

      Defaults to `false`.
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="planning" type="object">
  Settings for issue planning.

  Defaults to `{}`.

  <Expandable title="Planning">
    <ResponseField name="enabled" type="boolean">
      Issue Planner | Generate an implementation plan for issues (beta).

      Defaults to `true`.
    </ResponseField>

    <ResponseField name="auto_planning" type="object">
      Configuration for auto planning

      Defaults to `{}`.

      <Expandable title="Auto planning">
        <ResponseField name="enabled" type="boolean">
          Automatic Planning | Trigger issue planning based on labels.

          Defaults to `true`.
        </ResponseField>

        <ResponseField name="labels" type="array of string">
          Labels that trigger automatic issue planning. Labels starting with '!' are negative matches. Examples: \['feature', 'enhancement'] plans issues with either label. \['!wip'] plans all issues except those labeled 'wip'. \['feature', '!wip'] plans issues labeled 'feature' but not 'wip'.

          Defaults to `[]`.
        </ResponseField>
      </Expandable>
    </ResponseField>
  </Expandable>
</ResponseField>

<ResponseField name="labeling" type="object">
  Settings for issue labeling.

  Defaults to `{}`.

  <Expandable title="Labeling">
    <ResponseField name="labeling_instructions" type="array of object">
      Labeling Instructions | Define issue labels to suggest and when to suggest them.

      Defaults to `[]`.

      <Expandable title="Array Items">
        <ResponseField name="label" type="string">
          Label to suggest for the issue. Example: enhancement
        </ResponseField>

        <ResponseField name="instructions" type="string">
          Instructions for the label. Example: New feature or request.

          <Note>
            Max length: 3000
          </Note>
        </ResponseField>
      </Expandable>
    </ResponseField>

    <ResponseField name="auto_apply_labels" type="boolean">
      Automatically apply suggested labels to the issue. When enabled without labeling instructions, labels are auto-suggested based on similar issues.

      Defaults to `false`.
    </ResponseField>
  </Expandable>
</ResponseField>

## Related Resources

<CardGroup cols={3}>
  <Card title="Review Commands" icon="terminal" href="/reference/review-commands">
    Learn about @coderabbitai commands
  </Card>

  <Card title="Supported Tools" icon="wrench" href="/reference/tools-reference">
    Browse all supported linters and analyzers
  </Card>
</CardGroup>
