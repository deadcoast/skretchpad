# Issue Enrichment

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit automatically analyzes your issues to detect duplicates, find related issues and PRs, suggest assignees, and apply smart labels.

<Note>
  This feature is currently in open beta. We are actively improving it based on
  your feedback. If you encounter any issues or have suggestions, please share
  them on our [Discord community](https://discord.gg/coderabbit) or reach out to
  our [support team](https://www.coderabbit.ai/contact-us/support).
</Note>

## Overview

CodeRabbit Issue Enrichment automatically analyzes your issues and provides contextual
insights to help you work more efficiently. When you create or edit an issue, CodeRabbit
posts a comment with:

* 🔍 **Duplicate Detection** - Identifies if your issue already exists
* 🔗 **Similar Issues** - Shows related issues that might have solutions or context
* 🔗 **Related Pull Requests** - Finds PRs that addressed similar problems
* 👤 **Suggested Assignees** - Recommends team members based on expertise
* 🏷️ **Smart Labeling** - Automatically categorizes issues with appropriate labels

<Tip>
  Looking to generate implementation plans from issues? Check out [CodeRabbit
  Issue Planner](/issues/planner) for comprehensive step-by-step guides.
</Tip>

## Platform Support

Issue enrichment is currently available for <Icon icon="github" /> **GitHub Issues** - Full enrichment support including duplicate detection, similar issues, related PRs, suggested assignees, and smart labeling.

## Getting Started

Issue enrichment is enabled by default on GitHub issues. CodeRabbit will automatically enrich new issues with contextual information.

### Disable Issue Enrichment

To turn off automatic enrichment, add this to your `.coderabbit.yaml` configuration file:

```yaml  theme={null}
issue_enrichment:
  auto_enrich:
    enabled: false
```

## Features

### Duplicate Detection

CodeRabbit analyzes your issue against existing issues in your repository and knowledge
base to detect potential duplicates.

**What you'll see:**

```markdown  theme={null}
## 🔗 Similar Issues

**Possible Duplicates**

- https://github.com/owner/repo/issues/42
```

### Similar Issues

Discover related issues that might provide context, workarounds, or solutions.

**What you'll see:**

```markdown  theme={null}
## 🔗 Similar Issues

**Related Issues**

- https://github.com/owner/repo/issues/15
- https://github.com/owner/repo/issues/28
- https://github.com/owner/repo/issues/31
```

### Related Pull Requests

See PRs that addressed similar problems or touched related code.

**What you'll see:**

```markdown  theme={null}
## 🔗 Related PRs

#123 - Fix authentication bug [merged]
#145 - Update auth flow [open]
#98 - Improve login error handling [closed]
```

### Suggested Assignees

Get smart recommendations for who should work on the issue based on past contributions
to related issues and PRs.

**What you'll see:**

```markdown  theme={null}
## 👤 Suggested Assignees

- [@guritfaq](https://github.com/guritfaq)
- [@harjotgill](https://github.com/harjotgill)
- [@aravindputrevu](https://github.com/aravindputrevu)
```

### Smart Auto-Labeling

Automatically apply appropriate labels to issues based on their content.

#### Configuration

```yaml  theme={null}
issue_enrichment:
  labeling:
    auto_apply_labels: true
    labeling_instructions:
      - label: bug
        instructions: Issues reporting bugs, errors, crashes, incorrect behavior, or unexpected results. This includes runtime errors, logic errors, broken functionality, regressions, and any deviation from expected or documented behavior.
      - label: enhancement
        instructions: Feature requests, improvements to existing functionality, performance optimizations, refactoring suggestions, UI/UX enhancements, and any suggestions to make the project better or add new capabilities.
      - label: documentation
        instructions: Documentation updates, additions, corrections, or clarifications needed. This includes missing docs, outdated information, unclear instructions, API documentation, code examples, README improvements, and any requests for better explanations or guides.
```

## Frequently Asked Questions

### Can I customize what information is shown?

Currently, the enrichment format is standardized, but you can customize label categories with auto-labeling and configure auto-planning to choose which issues get plans.

### Does enrichment work for private repositories?

Yes! Issue enrichment works for both public and private repositories. Knowledge base and
enrichment respect your repository access controls.

### How does CodeRabbit find related issues and PRs?

CodeRabbit uses semantic similarity search on your knowledge base by indexing issues and PRs based upon vectorized representations (which cannot be reversed into the original issues and PR's).

### Will enrichment update when I edit the issue?

Yes! When you edit an issue that already has enrichment, CodeRabbit will re-analyze the updated content, search for new related issues and PRs, update the enrichment comment, and trigger auto-planning if labels changed.
