# Configuration via YAML File

> ## Documentation Index
> Fetch the complete [documentation-index](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further.
>
> Learn how to configure CodeRabbit using a YAML file for advanced customization.

In this guide, we will cover the configuration using a YAML file. For reference, you can find curated examples of YAML configurations in our [`awesome-coderabbit`](https://github.com/coderabbitai/awesome-coderabbit) repository.

## Configure CodeRabbit using a YAML File

<Note>
  `.coderabbit.yaml` configuration file must be located in the root of the
  repository. The configuration present in the feature branch under review will
  be automatically detected and used by CodeRabbit for that review.
</Note>

<Check>
  Move existing UI configuration to a YAML file?

  Use the `@coderabbitai configuration` command on any PR to get the current configuration in a YAML format. You can then copy the configuration to a `.coderabbit.yaml` file in the root of your repository.
</Check>

### Example Configuration

```yaml .coderabbit.yaml theme={null}
# yaml-language-server: $schema=https://coderabbit.ai/integrations/schema.v2.json
language: "en-US"
early_access: false
reviews:
  profile: "chill"
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

<Warning>
  Shared configuration is not recommended, as it may expose sensitive
  configuration details. Please use [Central
  Configuration](/configuration/central-configuration) for managing
  configurations across multiple repositories and [Configuration
  Inheritance](/configuration/configuration-inheritance) for reusing
  configurations across different layers.
</Warning>

If you are self-hosting CodeRabbit in an air-gapped environment, you can use the shared configuration feature to share the configuration across multiple repositories.

To use shared configuration, you need to:

1. Create a `.coderabbit.yaml` file and host it in a location that is publicly accessible (e.g., a web server, a public GitHub Gist).
2. Create a `.coderabbit.yaml` file in the root of your repository with the following content:

```yaml  theme={null}
remote_config:
  url: "https://your-config-location/.coderabbit.yaml"
```
