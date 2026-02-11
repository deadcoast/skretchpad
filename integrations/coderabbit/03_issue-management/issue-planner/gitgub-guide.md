# Planning on GitHub

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Generate comprehensive Coding Plans from your issues on the GitHub issue tracker.

<Note>
  This feature is currently in open beta. We are actively improving it based on
  your feedback. If you encounter any issues or have suggestions, please share
  them on our [Discord community](https://discord.gg/coderabbit) or reach out to
  our [support team](https://www.coderabbit.ai/contact-us/support).
</Note>

<Note>
  Issue Planner is available for **GitHub Cloud** only. GitHub Enterprise Server
  is not yet supported.
</Note>

## Initiating Planning

### Manual Planning

There are two ways to trigger Planning manually:

<CardGroup cols={1}>
  <Card title="CodeRabbit Command" icon="terminal" horizontal="true">
    Comment `@coderabbitai plan` on any GitHub Issue to generate a plan.
  </Card>

  <Card title="Checkbox" icon="square-check-big" horizontal="true">
    When Issue Enrichment is enabled, CodeRabbit posts a comment on new issues
    with a **Create Plan** checkbox. Check the box to generate a plan.
  </Card>
</CardGroup>

### Auto-Planning (Recommended)

Automatically generate plans when specific labels are added to issues.

<Tabs>
  <Tab title="Using configuration file">
    ```yaml  theme={null}
    issue_enrichment:
      planning:
        enabled: true
        auto_planning:
          enabled: true
          labels:
            - "plan-me" # Auto-plan issues with this label
            - "feature" # Also auto-plan these
            - "!no-plan" # Never auto-plan issues with this label
    ```
  </Tab>

  <Tab title="Using the Web Interface">
    To configure auto-planning labels in the CodeRabbit web app:

    1. Navigate to **Configuration → Issue Enrichment → Auto-Planning**
    2. Enable **Automatic Planning**
    3. Add your desired labels in the labels field:
       * Enter labels that should trigger auto-planning (e.g., `plan-me`, `feature`)
       * Use the `!` prefix for exclusion labels (e.g., `!no-plan`)
    4. Save your configuration

    The web interface provides the same functionality as the YAML configuration, allowing you to manage auto-planning labels without committing configuration files to your repository.

  </Tab>
</Tabs>

#### Label Matching Rules

| Configuration                    | Behavior                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------- |
| Inclusion only (e.g., `feature`) | Plans only issues with at least one matching label                            |
| Exclusion only (e.g., `!wip`)    | Plans all issues except those with excluded labels                            |
| Mixed (e.g., `feature`, `!wip`)  | Plans issues that have an inclusion label AND don't have any exclusion labels |

<Note>
  Exclusion labels (starting with `!`) always take priority over inclusion
  labels.
</Note>

## Viewing and Refining Plans

Once a Coding Plan is generated, CodeRabbit posts the full plan as a comment on the issue.

<Frame caption="Coding Plan posted as a comment on a GitHub issue">
  <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=720c50d5d557a1e5bc8838b37d0645f9" alt="Coding Plan posted as a comment on a GitHub issue" data-og-width="1856" width="1856" data-og-height="1162" height="1162" data-path="assets/images/planning-github-comment.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=2b63e7ec0fbcf1ab2942eee0f0e26d7d 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=704de913d52eb9828f2f7d45765f1d68 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=18079aaf5d574ebd469b08ff446d3652 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=2d57e486336f5f8a6a688aed8f9bb618 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a4cfe61ace8f771272e362ed759c07bd 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=fcc46a3401a814127b9f73cb1cf05ca5 2500w" />
</Frame>

### Chatting about Your Plan

Reply to the Coding Plan comment on the issue to:

- Ask questions about the plan or the codebase
- Request changes to specific tasks or phases
- Challenge design choices and provide additional context
- Get clarification on implementation details

<Frame caption="Discuss the Coding Plan with CodeRabbit">
  <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=20700f2bb53bfe8150f9d191505ffde9" alt="Discuss the Coding Plan with CodeRabbit" width="500" data-og-width="1152" data-og-height="740" data-path="assets/images/discuss-plan-github.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=3df09d7a0315a7797cb386c59531c9ad 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=548b61d5a25a93148a987fb09b75d81b 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a50d5e2cac17d0a587ed9a04af2f3732 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=369ba1037b2a03fa1679689193131e2c 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=947d3d11e18e18835a5aa52ff1090a6d 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/discuss-plan-github.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=1c19578161e3e68bf6f7963a2b0e7067 2500w" />
</Frame>

### Re-planning

Once asked to make changes, CodeRabbit will respond to your comment and update the plan accordingly. You can also comment `@coderabbitai plan` again on the issue to regenerate the plan from scratch.

### Handing Off to a Coding Agent

Copy the agentic prompts from the Coding Plan comment on the issue, and paste them into your preferred coding agent (Claude Code, Cursor, GitHub Copilot, etc.).

Alternatively, if your coding agent can access GitHub directly (for example, through the GitHub MCP), you can simply ask it to `fetch the issue by its number and execute CodeRabbit's plan`.
