# Issue Planner

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Turn issues into comprehensive Coding Plans ready for your favorite coding agent or IDE copilot. Works with Jira, Linear, GitHub, and GitLab!

<Note>
  This feature is currently in open beta. We are actively improving it based on
  your feedback. If you encounter any issues or have suggestions, please share
  them on our [Discord community](https://discord.gg/coderabbit) or reach out to
  our [support team](https://www.coderabbit.ai/contact-us/support).
</Note>

## Overview

CodeRabbit Issue Planner analyzes your issues, specifications, and project codebase to generate Coding Plans you can handoff to any coding agent or IDE copilot. Because CodeRabbit [deeply understands](/overview/architecture) your codebase through continuous analysis, each plan is tailored to your architecture and conventions, covering codebase research, step-by-step tasks, and agent-ready prompts.

## Supported Issue Trackers

CodeRabbit Issue Planner supports four issue trackers. See the platform-specific guides for setup and configuration details.

<CardGroup cols={4}>
  <Card title="Jira" icon="jira" href="/issues/planner/jira" horizontal="true" />

  <Card title="Linear" icon="linear" href="/issues/planner/linear" horizontal="true" />

  <Card title="GitHub" icon="github" href="/issues/planner/github" horizontal="true" />

  <Card title="GitLab" icon="gitlab" href="/issues/planner/gitlab" horizontal="true" />
</CardGroup>

## Planning

The recommended way to use Issue Planner is to **enable auto-planning** on your platform so that Coding Plans are generated automatically whenever it matches the conditions you configure. Refer to the platform-specific guides above to set up auto-planning.

To generate a plan on demand, comment `@coderabbitai plan` on any issue.

## Viewing and Refining Plans

How you view and refine Coding Plans depends on your platform:

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
    The Coding Plan is available in the CodeRabbit web app. Use the chat
    panel on the right to iterate on the plan before handing off the finalized prompts to
    your coding agent.

    <Frame caption="Coding Plan in CodeRabbit Web Interface">
            <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=675d1c116a50b922932579684cb300c3" alt="Plan Editor user interface" data-og-width="2918" width="2918" data-og-height="1596" height="1596" data-path="assets/images/plan-editor.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=1d373b47d899ba7188037bfe9a02d0dc 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=fbfad31bef68e0fba7b2a89db933d449 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=ce449bbd480847e02c8c1f92a2858e83 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=4a781b18895a37c484c0ee9512976c1b 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=d04ae1c2d1b540e489a43837f16fe107 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/plan-editor.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a3d9f2e06617cb10a8c860fa0e1340f9 2500w" />
    </Frame>
  </Card>
</CardGroup>

<Note>
  For platform-specific details on triggering and configuring plans, see the
  [GitHub](/issues/planner/github), [GitLab](/issues/planner/gitlab),
  [Jira](/issues/planner/jira), and [Linear](/issues/planner/linear) guides.
</Note>

### Plan Structure

Each Coding Plan contains the following sections:

| Section            | Description                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Summary**        | 2-3 sentence overview of the implementation approach                                                                                                                      |
| **Research**       | Deep codebase analysis leveraging CodeRabbit's project knowledge, identifying relevant files, patterns, dependencies, and architectural decisions specific to the project |
| **Design Choices** | Decisions made during planning with rationale for each                                                                                                                    |
| **Phases**         | Logical chunks of work that should be done together                                                                                                                       |
| **Tasks**          | Individual tasks within each phase                                                                                                                                        |
| **Agent Prompt**   | Machine-readable instructions for coding agents (per phase and combined)                                                                                                  |

### Chatting about Your Plan

Chat with CodeRabbit to ask questions, request changes to specific tasks or phases, challenge design choices, or get clarification on implementation details. CodeRabbit responds and updates the plan accordingly. See the platform-specific guides for details on how chatting works on your platform.

### Re-planning

Provide feedback and regenerate your plan to incorporate changes. See the platform-specific guides for details on the re-planning workflow.

### Handing Off to a Coding Agent

Once you're satisfied with a Coding Plan, copy the agentic prompts and paste them into your preferred coding agent (Claude Code, Cursor, GitHub Copilot, etc.). Depending on the platform, you can also handoff directly through the CodeRabbit IDE extension or let your coding agent fetch the plan via MCP. See the platform-specific guides for handoff options.

## Frequently Asked Questions

### How long does plan generation take?

Plan generation typically takes [between 5 and 10 minutes](#how-is-coderabbit-different-from-using-chatgpt-or-coding-agents-for-planning) depending on the complexity of the issue and codebase.

### Can I regenerate a plan?

Yes. You can regenerate a plan on all supported platforms. See your platform's guide for specific instructions.

### Can multiple people work on the same plan?

Yes. Anyone in your organization can view plans, discuss them with CodeRabbit, and trigger re-plans.

### How is CodeRabbit different from using ChatGPT or coding agents for planning?

Any AI agent or LLM can write an implementation plan. The difference is in the quality and context behind that plan:

1. **Deeper codebase understanding** - When an AI agent generates a plan, it typically reviews only a handful of files. CodeRabbit's Coding Plans are grounded in [deep codebase understanding](/overview/architecture) through continuous code analysis and an extensive knowledge base. This means plans reference the right files, follow your established patterns, and integrate seamlessly with your existing code.

2. **Access to issues and better context** - CodeRabbit works with issue trackers, surfacing relevant related issues, even when the assigned engineer isn't aware of them. This broader context ensures plans account for ongoing work, previous decisions, and the full scope of your project's direction.

3. **Collaborative review** - CodeRabbit plans are available for review by other engineers and product owners. Team members can discuss, challenge design choices, and refine plans together before implementation begins.

4. **Accountability and history** - Every plan version is preserved. You can track what was planned, when it was planned, and why decisions were made. This audit trail provides accountability and helps teams understand the evolution of features over time.
