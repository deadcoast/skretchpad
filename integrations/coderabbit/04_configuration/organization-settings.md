# Organization preferences

> ## Documentation Index
>
> Fetch the complete [documentation-index](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further
>
> Manage default CodeRabbit settings across your entire Git platform organization and configure repository-level overrides.

Configure CodeRabbit settings for your entire organization to establish consistent code review standards across all repositories. For a general overview of configuring CodeRabbit, see [Configure CodeRabbit](/guides/configuration-overview).

## About organization settings

You can use the CodeRabbit web interface to set the CodeRabbit configuration for all Git repositories associated with your organization. By default, all repositories apply your organization's CodeRabbit configuration.

<Info>
  You can override organization settings for individual repositories if needed.
  For more information, see [Set your repository
  preferences](/guides/repository-settings).
</Info>

## Browse and modify your organization settings

<Steps>
  <Step title="Access the CodeRabbit web interface">
    Visit [the CodeRabbit web
    interface](https://app.coderabbit.ai/settings/repositories).
  </Step>

  <Step title="Navigate to organization settings">
    In the sidebar, click **Organization Settings** > **Configuration**.
  </Step>

  <Step title="Modify settings">
    Browse and modify the settings using the UI form or switch to YAML mode for
    text-based editing. When you're finished making changes, click **Apply
    Changes** to save your configuration.
  </Step>
</Steps>

### UI vs YAML editing modes

The web interface provides two ways to edit your organization settings:

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
