# Repository preferences

> ## Documentation Index
>
> Fetch the complete [documentation-index](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further.
>
> Configure CodeRabbit's behavior for individual repositories using .coderabbit.yaml files or the web interface. Learn about configuration precedence and best practices.

## About repository settings

CodeRabbit provides three ways to manage its code-review behavior with each of your organization's repositories:

<CardGroup cols={3}>
  <Card title="Configuration file" icon="file-code">
    Add a `.coderabbit.yaml` file to your repository for version-controlled
    settings
  </Card>

  <Card title="Central configuration" icon="building">
    Apply organization-wide settings that inherit to all repositories
    automatically
  </Card>

  <Card title="Web interface" icon="browser">
    View or modify your per-repository settings using the CodeRabbit dashboard
  </Card>
</CardGroup>

### Configuration precedence

CodeRabbit applies settings in the following order:

<Steps>
  <Step title="Repository YAML file (highest priority)">
    If your repository contains a `.coderabbit.yaml` file at the top level of
    its default branch, CodeRabbit applies all settings from this file
  </Step>

  <Step title="Repository web interface settings">
    If your repository doesn't have a `.coderabbit.yaml` file, CodeRabbit
    applies the configuration from the repository's web interface settings
  </Step>

  <Step title="Central configuration (organization-wide)">
    Settings from your organization's central configuration are applied to
    repositories that don't have repository-specific settings
  </Step>

  <Step title="Default values (lowest priority)">
    CodeRabbit applies its own default values to any configuration settings not
    defined elsewhere
  </Step>
</Steps>

## Configure your repository with `.coderabbit.yaml`

<Card title="Learn more about YAML configuration" icon="file-text" href="/getting-started/yaml-configuration" horizontal="true">
  Complete guide to adding and customizing configuration files
</Card>

## Browse and modify your settings using the web interface

To view or modify your repository settings using the CodeRabbit web interface:

<Steps>
  <Step title="Open repository settings">
    Visit [the CodeRabbit web
    interface](https://app.coderabbit.ai/settings/repositories) and click
    **Repositories** in the sidebar
  </Step>

  <Step title="Select repository">
    Click the gear-shaped **Settings** icon of the repository whose settings you
    want to view or modify
  </Step>

  <Step title="Configure inheritance">
    If the **Use Organization Settings** toggle is on, click it to turn it off
    to customize this repository's settings

    <Note>
      If you leave the toggle on, CodeRabbit applies settings from [the
      organization-configuration page](/guides/organization-settings) to this
      repository
    </Note>

  </Step>

  <Step title="Apply changes">
    Browse and modify the settings using the UI form or switch to YAML mode for
    text-based editing. Click **Apply Changes** when you are finished
  </Step>
</Steps>

### UI vs YAML editing modes

The web interface provides two ways to edit your repository settings:

- **UI mode (default)**: Interactive form with dropdowns, checkboxes, and input fields
- **YAML mode**: Direct YAML editing with syntax highlighting and real-time validation

Switch between modes using the **Edit YAML** button at the top of the settings page (which changes to **Return to UI** when in YAML mode).
Changes made in either mode are reflected when switching between them.
When using YAML mode:

- Only non-default values are displayed for cleaner configuration
- Changes are validated in real-time as you type
- You can copy the entire YAML configuration to your clipboard
- The YAML structure matches `.coderabbit.yaml` format for easy transfer between web interface and repository files

> [!NOTE]
> Validation errors must be resolved before saving changes or switching back to UI mode.

---
