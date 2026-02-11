# Knowledge base

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Connect CodeRabbit to your team's tools and practices with adaptive AI that learns from your feedback and automatically detects your coding standards.

CodeRabbit's knowledge base makes reviews smarter by learning from your team's practices and integrating with your existing development tools. The AI adapts to your coding standards, remembers your preferences, and connects code changes to business context.

## Core capabilities

<CardGroup cols={3}>
  <Card title="Adaptive learnings" icon="brain">
    AI remembers your team's review preferences and improves over time
  </Card>

  <Card title="Code guidelines" icon="file-text">
    Automatic detection of team rules from .cursorrules, CLAUDE.md, and other AI
    agent files
  </Card>

  <Card title="Issue tracking" icon="bug">
    Connect with Jira, Linear, and GitHub Issues for better context
  </Card>
</CardGroup>

## Learnings: AI that adapts to your team

Train CodeRabbit to understand your team's specific preferences through natural conversation. The AI remembers your feedback and applies it to future reviews.

### Repository-wide preferences

Tell CodeRabbit about general coding standards for your entire repository:

```md theme={null}
@coderabbitai always remember to enforce camelCase variable naming
```

```md theme={null}
@coderabbitai we prefer functional components over class components in React
```

### Line-specific context

Add context for specific code patterns by commenting directly on lines:

```md theme={null}
@coderabbitai do not complain about lack of error handling here,
it is handled higher up the execution stack
```

```md theme={null}
@coderabbitai this timeout value is intentionally high for batch operations
```

Learnings work across pull requests, so CodeRabbit won't repeat suggestions your team has already addressed.

See [Teach CodeRabbit your review preferences](/guides/learnings) for advanced learning techniques.

## Code guidelines: Automatic team rules

CodeRabbit automatically detects and applies your team's coding standards from popular AI agent configuration files. No setup required - if you're already using AI coding tools, CodeRabbit understands your rules.

### Supported configuration files

<Accordion title="Automatically detected files">
  CodeRabbit scans for these patterns in your repositories:

- **`.cursorrules`** - Cursor AI editor rules
- **`.github/copilot-instructions.md`** - GitHub Copilot instructions
- **`CLAUDE.md`** - Claude Code configuration files
- **`.cursor/rules/`** - Cursor configuration directory
- **`.windsurfrules`** - Windsurf editor rules
- **`.clinerules/`** - Cline AI agent configuration
- **`agent.md`** and **`agents.md`** - AI agent instructions and guidelines
- **`.rules/`** - Generic team rules directory

  CodeRabbit applies these rules during code review automatically.
  </Accordion>

This means if you've already configured coding standards for Cursor, Claude, or other AI tools, CodeRabbit will follow the same guidelines. Your team's standards stay consistent across all AI interactions.

<Tip>
  Code guidelines work best when combined with learnings. Use guidelines for
  static rules and learnings for dynamic team preferences.
</Tip>

## Setup and configuration

### Enable knowledge base features

1. **Learnings**: Enabled by default. Start using `@coderabbitai` commands in pull request comments.

2. **Code guidelines**: Automatic detection enabled by default. Add supported configuration files to your repository root.

3. **Issue tracking**: Requires setup. See [Issue integrations](/integrations/issue-trackers) for platform-specific instructions.

### Best practices

- **Start with learnings**: Use `@coderabbitai` commands to teach preferences incrementally
- **Centralize guidelines**: Put team rules in `.cursorrules` or `CLAUDE.md` files at repository root
- **Be specific**: Clear, actionable guidelines work better than vague preferences
- **Review and iterate**: Check how CodeRabbit applies learnings and refine as needed

## Advanced usage

### Cross-repository learning

Learnings can apply across repositories in your organization, helping maintain consistent standards across all projects.

### Team collaboration

Multiple team members can contribute learnings. CodeRabbit synthesizes feedback from different reviewers to understand team consensus.

### Integration with AI agents

Code guidelines ensure consistency between CodeRabbit reviews and your existing AI coding assistants, creating a unified development experience.

## What's next

<CardGroup cols={2}>
  <Card title="Issue integrations" href="/integrations/issue-trackers">
    Connect Jira, Linear, and GitHub Issues for better context
  </Card>

  <Card title="Advanced learnings" href="/guides/learnings">
    Master CodeRabbit's adaptive AI capabilities
  </Card>
</CardGroup>
