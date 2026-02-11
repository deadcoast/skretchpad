# Configuration via YAML File

## Configuration Overview

> ## Documentation Index
>
> Fetch the [complete-documentatio](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further

## Configuration Overview

> Configure CodeRabbit to fit your organization and repositories using multiple approaches with clear priority rules.

CodeRabbit works out of the box with sensible defaults, but configuration lets you customize reviews for your team's specific needs. Choose from multiple configuration approaches based on your workflow preferences.

## Configuration approaches

### File-based

<CardGroup cols={2}>
  <Card title="YAML file (recommended)" icon="file-code" href="/getting-started/yaml-configuration">
    Version-controlled configuration committed to your repository
  </Card>

  <Card title="Central configuration" icon="layers" href="/configuration/central-configuration">
    Organization-wide configuration from a dedicated repository
  </Card>
</CardGroup>

### Web Interface-based

<CardGroup cols={2}>
  <Card title="Organization settings" icon="building-2" href="/guides/organization-settings">
    Apply the same configuration to all repositories in your organization
  </Card>

  <Card title="Repository settings" icon="git-branch" href="/guides/repository-settings">
    Configure individual repositories with specific needs
  </Card>
</CardGroup>

### Organization settings

Use organization settings when you want consistent CodeRabbit behavior across all your repositories. Configure once in the web UI and all repositories inherit the same settings.

Best for: Teams with standardized coding practices across projects.

See [Organization preferences](/guides/organization-settings).

### Repository settings

Use repository settings when different projects need different CodeRabbit configurations. Configure each repository individually through the web UI or with a local `.coderabbit.yaml` file.

Best for: Organizations with diverse projects requiring specific review approaches.

See [Repository preferences](/guides/repository-settings).

### YAML file (recommended)

Create a `.coderabbit.yaml` file in your repository root for version-controlled configuration. This approach gives you the benefits of infrastructure-as-code: configuration changes go through code review, maintain history, and deploy with your application.

Best for: Teams that prefer GitOps workflows and want configuration changes tracked in version control.

See the [configuration reference](/reference/configuration#reference) for all available options and [sample configurations](/configuration) for language-specific recommendations.

### Central configuration

Create a dedicated `coderabbit` repository in your organization with a `.coderabbit.yaml` file. This configuration automatically applies to any repository that doesn't have its own settings, giving you organization-wide defaults with the flexibility of repository-specific overrides.

Best for: Organizations wanting centralized configuration management without requiring individual repository setup.

See [Central configuration](/configuration/central-configuration) for setup instructions and platform support.

## Understanding configuration priority

Configuration sources don't merge by default. When you use multiple configuration methods, CodeRabbit follows a strict priority hierarchy:

<Steps>
  <Step title="Local .coderabbit.yaml file">
    **Highest priority** - Completely overrides all other settings
  </Step>

  <Step title="Central configuration">
    **High priority** - Organization-wide defaults from dedicated repository
  </Step>

  <Step title="Repository settings">
    **Medium priority** - Web UI settings for individual repositories
  </Step>

  <Step title="Organization settings">
    **Lowest priority** - Web UI settings for entire organization
  </Step>
</Steps>

<Warning>
  You can enable `configuration inheritance` to [let CodeRabbit merge
  configuration](/configuration/configuration-inheritance) from parent levels
  instead of using only the highest-priority source.
</Warning>

**Example:** If you set a custom timeout in organization settings and central configuration but have a local `.coderabbit.yaml` that doesn't mention timeouts and `configuration inheritance` is disabled, CodeRabbit uses the default timeout value, not your organization or central configuration settings.

## Adaptive configuration

Besides manual configuration, CodeRabbit automatically builds learnings about your team's review preferences based on your interactions with review comments over time. This creates a dynamic, self-improving configuration layer.

Learnings capture patterns like:

- Which types of suggestions your team typically accepts or rejects
- Coding standards specific to your repositories
- Review focus areas that matter most to your workflow

<CardGroup cols={1}>
  <Card title="Learnings" icon="brain" href="/guides/learnings" horizontal="true">
    How learnings work and how to manage them
  </Card>
</CardGroup>

---

## Configuration inheritance

> Learn how CodeRabbit merges configuration settings across multiple levels, from repository files to organization defaults.

Configuration inheritance allows you to share common settings across repositories while still allowing individual repositories to customize specific values. When enabled, CodeRabbit merges configuration from parent levels instead of using only the highest-priority source.

<Note>
  Inheritance is **disabled by default**. You must explicitly enable it by
  adding `inheritance: true` to your configuration file.
</Note>

## Enabling inheritance

Add `inheritance: true` at the root level of your `.coderabbit.yaml` file:

```yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
inheritance: true
reviews:
  profile: chill
  auto_review:
    enabled: true
```

When inheritance is enabled:

1. CodeRabbit merges values from the parent configuration level
2. If the parent also has `inheritance: true`, the chain continues to the grandparent level
3. The chain stops at the first level where `inheritance:false` or not set

## Configuration hierarchy

CodeRabbit resolves configuration from multiple levels. Without inheritance, only the highest-priority source is used. With inheritance enabled, values merge across levels.

### Cloud/SaaS deployment

| Priority    | Source          | Location                                      |
| ----------- | --------------- | --------------------------------------------- |
| 1 (Highest) | Repository YAML | `.coderabbit.yaml` in the repository          |
| 2           | Central YAML    | `.coderabbit.yaml` in `coderabbit` repository |
| 3           | Repository UI   | CodeRabbit UI - Repository Settings           |
| 4           | Organization UI | CodeRabbit UI - Organization Settings         |
| 5 (Lowest)  | Defaults        | CodeRabbit schema defaults                    |

### Self-hosted deployment

| Priority    | Source           | Location                                      |
| ----------- | ---------------- | --------------------------------------------- |
| 1 (Highest) | Repository YAML  | `.coderabbit.yaml` in the repository          |
| 2           | Central YAML     | `.coderabbit.yaml` in `coderabbit` repository |
| 3           | Environment YAML | `YAML_CONFIG` environment variable            |
| 4 (Lowest)  | Defaults         | CodeRabbit schema defaults                    |

## How inheritance works

When you enable inheritance, CodeRabbit walks up the configuration hierarchy and merges values. The merge behavior depends on the data type.

### How the inheritance chain works

```
Repository YAML (inheritance: true)
       ↓ merges with
Central YAML (inheritance: true)
       ↓ merges with
Organization UI (inheritance: false)
       ✗ chain stops here
```

- Each level with `inheritance: true` merges with its parent
- The chain stops at the first level where `inheritance:false` or unset
- Missing configuration levels are skipped automatically

### Merge behavior by type

| Type        | Behavior                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| **Objects** | Deep merge - child properties override parent properties at each nesting level                                 |
| **Arrays**  | Child items first, then unique parent items appended (deduplicated by `path`, `label`, `name`, `id`, or `key`) |
| **Scalars** | Simple override - child value wins when defined                                                                |

### Example

This example demonstrates all three merge behaviors.

**Repository configuration** (`.coderabbit.yaml`):

```yaml theme={null}
inheritance: true
language: 'de-DE'
reviews:
  profile: assertive
  auto_review:
    drafts: false
  path_instructions:
    - path: 'src/**'
      instructions: 'Use strict TypeScript settings'
    - path: 'api/**'
      instructions: 'Validate API contracts'
```

**Central configuration** (`coderabbit/.coderabbit.yaml`):

```yaml theme={null}
inheritance: true
language: 'en-US'
reviews:
  profile: chill
  request_changes_workflow: true
  high_level_summary: true
  auto_review:
    enabled: true
    drafts: true
  path_instructions:
    - path: 'src/**'
      instructions: 'Follow our coding standards'
    - path: 'docs/**'
      instructions: 'Check for grammar and clarity'
    - path: 'tests/**'
      instructions: 'Ensure adequate test coverage'
chat:
  art: false
```

**Merged result**:

```yaml theme={null}
language: 'de-DE' # scalar: child wins
reviews:
  profile: assertive # scalar: child wins
  request_changes_workflow: true # object: inherited from central
  high_level_summary: true # object: inherited from central
  auto_review:
    enabled: true # object: inherited from central
    drafts: false # scalar: child wins
  path_instructions: # array: child-first, then unique parent items
    - path: 'src/**'
      instructions: 'Use strict TypeScript settings' # from repo
    - path: 'api/**'
      instructions: 'Validate API contracts' # from repo
    - path: 'docs/**'
      instructions: 'Check for grammar and clarity' # from central (unique)
    - path: 'tests/**'
      instructions: 'Ensure adequate test coverage' # from central (unique)
chat:
  art: false # object: inherited from central
```

<Note>
  The `src/**` path instruction from central is excluded because the repository
  already defines the same `path`. Arrays deduplicate using the first available
  stable key: `path`, `label`, `name`, `id`, or `key`.
</Note>

## Common use cases

### Organization-wide defaults

Set up common settings in your central `coderabbit` repository, then enable inheritance in individual repositories to use those defaults while customizing specific values.

**Central configuration** (`organization/coderabbit/.coderabbit.yaml`):

```yaml theme={null}
inheritance: true
reviews:
  profile: chill
  request_changes_workflow: true
  high_level_summary: true
  path_instructions:
    - path: '**/*.test.*'
      instructions: 'Verify test coverage and edge cases'
chat:
  art: false
```

**Repository configuration** (`organization/my-repo/.coderabbit.yaml`):

```yaml theme={null}
inheritance: true
reviews:
  profile: assertive # This repo needs stricter reviews
  path_instructions:
    - path: 'src/api/**'
      instructions: 'Ensure backward compatibility'
```

The repository inherits all central settings but uses an assertive review profile and adds API-specific instructions.

### Team-specific configurations (GitLab)

GitLab's nested group structure allows team-specific configurations. Each team can have their own `coderabbit` repository with settings that inherit from parent groups.

```
company/coderabbit                     # Organization defaults
company/backend/coderabbit             # Backend team settings (inherits from company)
company/backend/payments/coderabbit    # Payments team settings (inherits from backend)
```

Each level can enable inheritance to merge with its parent while adding team-specific customizations.

## Related topics

- [Central configuration](/configuration/central-configuration) - Set up organization-wide configuration
- [YAML configuration](/getting-started/yaml-configuration) - Configuration file reference
- [Organization settings](/guides/organization-settings) - Managing organization-level settings
- [Repository settings](/guides/repository-settings) - Configuring individual repositories

---

## Configure CodeRabbit using a YAML File

In this guide, we will cover the configuration using a YAML file. For reference, you can find curated examples of YAML configurations in our [`awesome-coderabbit`](https://github.com/coderabbitai/awesome-coderabbit) repository.

> [!NOTE]
> `.coderabbit.yaml` configuration file must be located in the root of the repository. The configuration present in the feature branch under review will be automatically detected and used by CodeRabbit for that review.

---

> [!TIP]
> Move existing UI configuration to a YAML file?
>
> Use the `@coderabbitai configuration` command on any PR to get the current configuration in a YAML format. You can then copy the configuration to a `.coderabbit.yaml` file in the root of your repository.

---

### Example Configuration

```yaml .coderabbit.yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: 'en-US'
early_access: false
reviews:
  profile: 'chill'
  request_changes_workflow: false
  high_level_summary: true
  poem: true
  review_status: true
  review_details: false
  auto_review:
    enabled: true
    drafts: false
chat:
  auto_reply: true
```

## Configuration Options

The configuration file supports numerous options for customizing CodeRabbit's behavior. For the complete list of available configuration options and their descriptions, see the [configuration reference](/reference/configuration#reference).

<CardGroup cols={1}>
  <Card title="Configuration Reference" icon="book" href="/reference/configuration" horizontal="true">
    Complete documentation of all options
  </Card>
</CardGroup>

Please note that code reviews commence with new pull requests or incremental commits to existing pull requests once the CodeRabbit app is installed. Should you have any questions or require assistance, our support team is here to help.

## Shared configuration

> [!WARNING]
> Shared configuration is not recommended, as it may expose sensitive configuration details.
> Please use [CentralConfiguration](/configuration/central-configuration) for managing configurations across multiple repositories and [ConfigurationInheritance](/configuration/configuration-inheritance) for reusing configurations across different layers.

---

If you are self-hosting CodeRabbit in an air-gapped environment, you can use the shared configuration feature to share the configuration across multiple repositories.

To use shared configuration, you need to:

1. Create a `.coderabbit.yaml` file and host it in a location that is publicly accessible (e.g., a web server, a public GitHub Gist).
2. Create a `.coderabbit.yaml` file in the root of your repository with the following content:

```yaml theme={null}
remote_config:
  url: 'https://your-config-location/.coderabbit.yaml'
```

---

## Central configuration

> Manage CodeRabbit settings across all repositories from a single central location, eliminating per-repository configuration updates.

Maintain CodeRabbit configuration for your entire organization in one dedicated repository. Create a `coderabbit` repository in your organization and add your `.coderabbit.yaml` file - CodeRabbit automatically applies these settings to any repository that doesn't have its own configuration.

<CardGroup cols={2}>
  <Card title="Organization-wide consistency" icon="building-2">
    Single source of truth for code review standards across all repositories
  </Card>

  <Card title="Simplified management" icon="settings">
    Update settings once instead of modifying each repository individually
  </Card>
</CardGroup>

<Card title="Configuration hierarchy" icon="layers">
  Repository configs override central configs, which override organization
  defaults - giving you flexibility when needed
</Card>

## How configuration resolution works

CodeRabbit checks for configuration in this priority order:

| Priority    | Source                | Location                                      |
| ----------- | --------------------- | --------------------------------------------- |
| 1 (Highest) | Repository file       | `.coderabbit.yaml` in the repository          |
| 2           | Central repository    | `.coderabbit.yaml` in `coderabbit` repository |
| 3           | Repository settings   | CodeRabbit UI - Repository Settings           |
| 4           | Organization settings | CodeRabbit UI - Organization Settings         |
| 5 (Lowest)  | Default settings      | CodeRabbit schema defaults                    |

The configuration source appears in the CodeRabbit comment on the pull request:

- **Repository file**: `Path: .coderabbit.yaml`
- **Central repository**: `Repository: coderabbit/.coderabbit.yaml`
- **UI settings**: `CodeRabbit UI`

## Setup

> [!WARNING]
> **Critical requirement**: You must install CodeRabbit on the central `coderabbit` repository. CodeRabbit needs access to read the configuration file.

---

> [!IMPORTANT]
> STEP 1: Create the central repository

Create a repository named `coderabbit` in your organization. The location depends on your platform:

- **GitHub**: `organization/coderabbit`
- **GitLab**: `group/coderabbit` (or `group/subgroup/coderabbit` for nested
  groups)
- **Azure DevOps**: `project/coderabbit`
- **Bitbucket Cloud**: `workspace/coderabbit`

---

> [!IMPORTANT]
> STEP 2: Add your configuration

Create a `.coderabbit.yaml` file in the repository root with your
organization's settings:

```yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
reviews:
  in_progress_fortune: false
  profile: chill
  request_changes_workflow: true
  high_level_summary: true
  poem: false
  review_status: true
  auto_review:
  enabled: true
  drafts: true
chat:
  art: false
```

---

> [!IMPORTANT]
> STEP 3: Install CodeRabbit

Install CodeRabbit on the central `coderabbit` repository through your
platform's installation process.

---

> [!IMPORTANT]
> STEP 4: Verify configuration

Check a repository that doesn't have its own `.coderabbit.yaml` file. The
configuration source should show `Repository: coderabbit/.coderabbit.yaml`
in the CodeRabbit UI.

## GitLab hierarchical configuration

GitLab supports team-specific configurations through its nested group structure. CodeRabbit automatically finds the closest `coderabbit` repository in your group hierarchy, allowing different teams to have their own settings while maintaining organization-wide defaults.

**Configuration inheritance example**:

| Project path                      | Configuration used                  |
| --------------------------------- | ----------------------------------- |
| `company/team-a/subteam/project1` | `company/team-a/subteam/coderabbit` |
| `company/team-a/project2`         | `company/team-a/coderabbit`         |
| `company/team-b/project3`         | `company/coderabbit`                |

This enables team-specific configurations with automatic fallback to parent group settings.

## Platform limitations

- **Azure DevOps**: Each project requires its own `coderabbit` repository - no cross-project configuration sharing
- **Bitbucket Server**: Central configuration not yet implemented - use individual repository settings

## Repository overrides

Individual repositories can override central configuration by adding their own `.coderabbit.yaml` file.

```yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
# Repository-specific config
reviews:
  profile: assertive
  high_level_summary: true
  poem: true
  review_status: true
  auto_review:
    enabled: true
    drafts: false
chat:
  art: true
```

When a repository has its own configuration file, CodeRabbit uses that instead of the central configuration. Repository settings take precedence over central settings.

## Related topics

- [Configuration overview](/guides/configuration-overview) - Understanding CodeRabbit configuration options
- [Organization settings](/guides/organization-settings) - Managing organization-level settings
- [Repository settings](/guides/repository-settings) - Configuring individual repositories
- [Configuration reference](/reference/configuration#reference) - Complete configuration reference
