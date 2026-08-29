# Overview

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Discover how CodeRabbit transforms your development workflow with AI-powered code reviews that provide instant, comprehensive feedback on every pull request.

Transform your code review process with CodeRabbit's AI-powered analysis that delivers comprehensive feedback within minutes of creating a pull request. Get detailed summaries, security insights, and improvement suggestions that help your team ship better code faster.

<Note>
  Ready to see CodeRabbit in action? Try our [hands-on guide](/guide) for a
  demonstration using a real repository.
</Note>

## What CodeRabbit does for your pull requests

CodeRabbit automatically analyzes every pull request with a multi-layered approach that combines the best of AI and industry-standard tools:

<CardGroup cols={2}>
  <Card title="Bug detection" icon="bug" horizontal="true">
    Spot potential runtime errors, null pointer exceptions, race conditions, and
    logic flaws before deployment
  </Card>

  <Card title="One-click fixes" icon="mouse-pointer-click" horizontal="true">
    Apply suggested changes directly to your PR with a single click—no
    copy-paste, no switching contexts
  </Card>

  <Card title="AI-generated summaries" icon="file-text" horizontal="true">
    Comprehensive summaries and walkthroughs of code changes with contextual
    insights
  </Card>

  <Card title="Security & quality analysis" icon="shield-check" horizontal="true">
    Integration with 40+ open-source linters and security scanners for
    comprehensive coverage
  </Card>

  <Card title="Intelligent suggestions" icon="lightbulb" horizontal="true">
    Context-aware improvement recommendations based on your entire repository
  </Card>

  <Card title="Code graph analysis" icon="git-branch" horizontal="true">
    Deep understanding of code relationships and dependencies across your
    project
  </Card>
</CardGroup>

## How automatic reviews work

<Steps>
  <Step title="Integration setup">
    After you [connect CodeRabbit to your
    repository](/getting-started/quickstart), it monitors for new pull requests
    and commits
  </Step>

  <Step title="Instant analysis">
    When a pull request is created, CodeRabbit immediately begins analyzing the
    code changes using multiple AI models and static analysis tools
  </Step>

  <Step title="Comprehensive review">
    Within minutes, CodeRabbit publishes detailed review comments with
    summaries, security findings, improvement suggestions and one-click fixes
  </Step>

  <Step title="Continuous updates">
    For subsequent commits, CodeRabbit performs incremental reviews focusing on
    the new changes
  </Step>
</Steps>

## Review types and severity levels

CodeRabbit categorizes its feedback into different types and severity levels to help you prioritize and address issues effectively.

### Review types

CodeRabbit provides three types of review feedback:

- ⚠️ **Potential issue** - Identifies potential bugs, security vulnerabilities, or problematic code patterns
- 🛠️ **Refactor suggestion** - Recommends code improvements for maintainability, performance, or best practices
- 🧹 **Nitpick** - Suggests minor style or formatting improvements (only in Assertive mode)

### Severity levels

Each review comment is assigned a severity level to indicate its importance:

- 🔴 **Critical** - Severe issues that could cause system failures, security breaches, or data loss
- 🟠 **Major** - Significant problems that impact functionality or performance
- 🟡 **Minor** - Issues that should be addressed but don't critically impact the system
- 🔵 **Trivial** - Low-impact suggestions for code quality improvements
- ⚪ **Info** - Informational comments or context without requiring action

### Review triggers and events

CodeRabbit automatically initiates reviews based on these repository activities:

<Tabs>
  <Tab title="New pull requests" icon="git-pull-request">
    **Full comprehensive review** when a new pull request is created - Complete
    analysis of all proposed changes - Security and quality assessment - Code
    style and best practices review
  </Tab>

  <Tab title="New commits" icon="git-commit">
    **Incremental review** when existing pull requests receive new commits -
    Focus on newly added changes - Updates to previous recommendations -
    Maintains conversation context
  </Tab>
</Tabs>

## Interactive code reviews with CodeRabbit

Once CodeRabbit reviews your pull request, you can engage in dynamic conversations and request specific actions by mentioning `@coderabbitai` in your comments.

<CardGroup cols={1}>
  <Card title="Control reviews" icon="settings" href="/guides/commands" horizontal="true">
    Pause, resume, or customize review behavior with simple commands
  </Card>
</CardGroup>

### Smart conversation capabilities

<Tabs>
  <Tab title="Contextual chat" icon="message-circle">
    Ask CodeRabbit questions about your code changes, architecture decisions, or implementation approaches. It has access to your entire repository for informed responses.

    ```md  theme={null}
    @coderabbitai Why did you suggest using a factory pattern here?
    ```

  </Tab>

  <Tab title="Review control" icon="pause-circle">
    Manage CodeRabbit's review behavior for specific pull requests:

    ```md  theme={null}
    @coderabbitai pause
    @coderabbitai resume
    @coderabbitai resolve
    ```

  </Tab>

  <Tab title="Code generation" icon="sparkles">
    Request CodeRabbit to generate documentation:

    ```md  theme={null}
    @coderabbitai generate docstrings
    ```

  </Tab>
</Tabs>

<Tip>
  CodeRabbit [learns from your feedback](/guides/learnings) and coding patterns
  to provide increasingly relevant suggestions over time.
</Tip>

## Next steps

Ready to dive deeper into CodeRabbit's capabilities? Explore these essential features to maximize your code review experience:

<CardGroup cols={1}>
  <Card title="Review commands" icon="terminal" href="/guides/commands" horizontal="true">
    Learn all the commands to control CodeRabbit's behavior during reviews
  </Card>
</CardGroup>
