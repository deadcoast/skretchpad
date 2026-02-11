# Configuration Examples

> ## Documentation Index
> Fetch the complete [documentation-index](https://docs.coderabbit.ai/llms.txt)
> Use this file to discover all available pages before exploring further.
>
> This section provides ready-to-use CodeRabbit configuration examples tailored to specific frameworks, languages, and project types. Each example demonstrates best practices and common patterns for configuring CodeRabbit to work effectively with your technology stack.

## What You'll Find Here

These configuration examples are curated from real-world usage and show how to:

* Set up framework-specific review instructions
* Configure path filters for common project structures
* Customize review behavior for different file types
* Apply best practices for your technology stack
* Handle platform-specific concerns (mobile, web, backend, etc.)

## How to Use These Examples

1. **Browse** the examples to find one that matches your project type
2. **Copy** the configuration that best fits your needs
3. **Customize** the settings to match your team's coding standards and preferences
4. **Add** the configuration to your repository as [`.coderabbit.yaml`](/getting-started/yaml-configuration)

## Available Examples

<CardGroup cols={1}>
  <Card title="React Native + Expo" href="/configuration/example/typescript/expo" horizontal="true">
    Mobile development configuration with Expo-specific best practices,
    performance optimization, and accessibility guidelines for React Native
    applications.
  </Card>

  <Card title="Python + Django" href="/configuration/example/python/django" horizontal="true">
    Django web framework configuration focusing on model validation, queryset
    optimization, and comprehensive docstring requirements.
  </Card>

  <Card title="Mintlify Documentation" href="/configuration/example/other/mintlify-documentation" horizontal="true">
    Documentation site configuration for Mintlify projects with MDX content
    validation, duplication detection, and navigation consistency checks.
  </Card>
</CardGroup>

## Contributing

These examples are part of a growing collection of [sample and community-contributed configurations](https://github.com/coderabbitai/awesome-coderabbit). More examples for different frameworks and use cases will be added over time.

Want to share your configuration? Check out the [awesome-coderabbit](https://github.com/coderabbitai/awesome-coderabbit) repository on GitHub to contribute your own examples and discover more configurations from the community.

<Note>
  Each configuration file includes inline comments explaining the purpose of
  each setting. Start with an example close to your stack and adjust as needed.
</Note>

## Next Steps

* Learn more about [YAML configuration](/getting-started/yaml-configuration)
* Explore the full [configuration reference](/reference/configuration)
* Understand [configuration inheritance](/configuration/configuration-inheritance)
