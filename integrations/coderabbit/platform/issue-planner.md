# Issue Planner

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Transform any issue into a comprehensive Coding Plan with research, tasks, and AI-ready prompts, powered by CodeRabbit's deep codebase understanding.

<Note>
  This feature is currently in open beta. We are actively improving it based on
  your feedback. If you encounter any issues or have suggestions, please share
  them on our [Discord community](https://discord.gg/coderabbit) or reach out to
  our [support team](https://www.coderabbit.ai/contact-us/support).
</Note>

CodeRabbit reviews millions of pull requests. Its deep codebase understanding can help you **before** you write a single line of code! Comment `@coderabbitai plan` on any issue and let CodeRabbit use its knowledge of your codebase and established patterns to generate a detailed Coding Plan you can review, adjust, and handoff directly to your favorite coding agent.

<CardGroup cols={3}>
  <Card title="Codebase & Issue Context" icon="microscope">
    Explores your codebase and relevant related issues to find the right files,
    patterns, and make architectural decisions fitting your project.
  </Card>

  <Card title="Collaborative Planning" icon="users-round">
    Engineers, product owners, and AI iterate together. Every version is preserved
    for accountability and tracking decisions over time.
  </Card>

  <Card title="Agent-Ready Prompts" icon="bot">
    AI-ready prompts designed for Claude Code, Cursor, GitHub Copilot, and any
    other coding agents.
  </Card>
</CardGroup>

## Supported Issue Trackers

<CardGroup cols={4}>
  <Card title="Jira" icon="jira" href="/issues/planner/jira" horizontal="true" />

  <Card title="Linear" icon="linear" href="/issues/planner/linear" horizontal="true" />

  <Card title="GitHub" icon="github" href="/issues/planner/github" horizontal="true" />

  <Card title="GitLab" icon="gitlab" href="/issues/planner/gitlab" horizontal="true" />
</CardGroup>

## Refine Your Plan

Chat with CodeRabbit to refine details, challenge design choices, or request changes. The conversation is collaborative: product owners and other team members can participate too, ensuring the plan reflects the team's knowledge before handing off the finalized prompts to your coding agent.

<CardGroup cols={2}>
  <Card title="GitHub & GitLab">
    The full Coding Plan is posted as a comment directly on the issue. Reply to
    the plan comment to refine details, challenge design choices, or request
    changes.

    <Frame caption="Coding Plan posted as a comment on a GitHub issue">
            <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=720c50d5d557a1e5bc8838b37d0645f9" alt="Coding Plan as GitHub issue comment" data-og-width="1856" width="1856" data-og-height="1162" height="1162" data-path="assets/images/planning-github-comment.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=2b63e7ec0fbcf1ab2942eee0f0e26d7d 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=704de913d52eb9828f2f7d45765f1d68 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=18079aaf5d574ebd469b08ff446d3652 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=2d57e486336f5f8a6a688aed8f9bb618 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a4cfe61ace8f771272e362ed759c07bd 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/planning-github-comment.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=fcc46a3401a814127b9f73cb1cf05ca5 2500w" />
    </Frame>
  </Card>

  <Card title="Jira & Linear">
    Review, tune, and adjust your Coding Plan in the CodeRabbit web app. Use the chat
    panel to iterate on the plan before handing off the finalized prompts to
    your coding agent.

    <Frame caption="Coding Plan in CodeRabbit Web Interface">
            <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=675d1c116a50b922932579684cb300c3" alt="Plan Editor user interface" data-og-width="2918" width="2918" data-og-height="1596" height="1596" data-path="assets/images/plan-editor.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=1d373b47d899ba7188037bfe9a02d0dc 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=fbfad31bef68e0fba7b2a89db933d449 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=ce449bbd480847e02c8c1f92a2858e83 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=4a781b18895a37c484c0ee9512976c1b 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=d04ae1c2d1b540e489a43837f16fe107 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a3d9f2e06617cb10a8c860fa0e1340f9 2500w" />
    </Frame>
  </Card>
</CardGroup>

## Key Capabilities

Any AI agent can generate a plan. CodeRabbit Issue Planner provides additional capabilities:

<CardGroup cols={1}>
  <Card title="Deep codebase understanding" icon="brain" horizontal="true">
    When an AI agent generates a plan, it typically reviews only a handful of
    files. CodeRabbit's plans are grounded in deep codebase understanding
    through continuous code analysis and an extensive knowledge base.
  </Card>

  <Card title="Access to issues provides better context" icon="search" horizontal="true">
    CodeRabbit works with issue trackers, surfacing relevant related issues into
    the context, even when the assigned engineer isn't aware of them.
  </Card>

  <Card title="Collaborative review" icon="users" horizontal="true">
    CodeRabbit plans are available for review by other engineers and product
    owners. Team members can discuss, challenge design choices, and refine plans
    together.
  </Card>

  <Card title="Accountability and history" icon="clipboard-clock" horizontal="true">
    Every plan version is preserved. You can track what was planned, when it was
    planned, and why decisions were made.
  </Card>
</CardGroup>

## What's next

<CardGroup cols={1}>
  <Card title="Issue Planner guide" icon="book" href="/issues/planner" horizontal="true">
    Coding Plans, refinement through chat, version history, and agent handoff
    options.
  </Card>

  <Card title="CodeRabbit Architecture" icon="microchip" href="/overview/architecture" horizontal="true">
    The system behind every coding plan and review comment.
  </Card>
</CardGroup>
