# Central configuration

> ## Documentation Index
>
> Fetch the complete [documentation-index](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further.
>
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

<Warning>
  **Critical requirement**: You must install CodeRabbit on the central
  `coderabbit` repository. CodeRabbit needs access to read the configuration
  file.
</Warning>

<Steps>
  <Step title="Create the central repository">
    Create a repository named `coderabbit` in your organization. The location depends on your platform:

    * **GitHub**: `organization/coderabbit`
    * **GitLab**: `group/coderabbit` (or `group/subgroup/coderabbit` for nested
      groups)
    * **Azure DevOps**: `project/coderabbit`
    * **Bitbucket Cloud**: `workspace/coderabbit`

  </Step>

  <Step title="Add your configuration">
    Create a `.coderabbit.yaml` file in the repository root with your
    organization's settings:

    ```yaml .coderabbit.yaml theme={null}
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

  </Step>

  <Step title="Install CodeRabbit">
    Install CodeRabbit on the central `coderabbit` repository through your
    platform's installation process.
  </Step>

  <Step title="Verify configuration">
    Check a repository that doesn't have its own `.coderabbit.yaml` file. The
    configuration source should show `Repository: coderabbit/.coderabbit.yaml`
    in the CodeRabbit UI.
  </Step>
</Steps>

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

    ```yaml
    # .coderabbit.yaml theme={null}
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
