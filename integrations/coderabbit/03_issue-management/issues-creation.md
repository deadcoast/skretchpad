# Create issues

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Turn code discussions into tracked issues across GitHub, GitLab, Jira, and Linear directly from CodeRabbit's chat interface.

<Info>
  This feature is available exclusively as part of the Pro plan. Please refer to
  our [pricing page](https://coderabbit.ai/pricing) for more information about
  our plans and features.
</Info>

When reviewing code, important issues often surface in discussions but get lost without proper tracking. CodeRabbit bridges this gap by creating issues directly from pull request conversations or chat interactions, ensuring nothing falls through the cracks.

CodeRabbit supports issue creation across GitHub, GitLab, Jira, and Linear. You can create issues naturally through conversations—just mention `@coderabbitai` and describe what needs to be tracked.

## Creating issues through agentic chat

The most straightforward way to create issues is through CodeRabbit's chat interface. During pull request reviews or in comment threads, mention `@coderabbitai` and ask to create an issue. CodeRabbit analyzes the context and creates a well-structured issue with relevant details (code context, discussion history, etc.) for your chosen platform.

<Frame caption="Creating an issue through CodeRabbit's agentic chat interface">
  <img src="https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=88c3f844376d55ec02a98385aa306eca" alt="Creating an issue through CodeRabbit's agentic chat interface" width="400" data-og-width="996" data-og-height="558" data-path="assets/images/create-issue.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=280&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=4e4ba222ec019fa26be834eae7979226 280w, https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=560&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=4ce7607e33c09b5ee1fd09c5fb941eec 560w, https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=840&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=60071987432f2052ae600df0aaefd737 840w, https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=1100&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=e01204b2892af506410d1112536ab497 1100w, https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=1650&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=7dad962a521f41fff989855036598d85 1650w, https://mintcdn.com/coderabbit/Ohu2ApSi3AllnNTq/assets/images/create-issue.png?w=2500&fit=max&auto=format&n=Ohu2ApSi3AllnNTq&q=85&s=f5ac1b4512006a2cbefb38764bd567bc 2500w" />
</Frame>

## Supported platforms

<CardGroup cols={1}>
  <Card title="GitHub and GitLab" icon="git-alt" horizontal="true">
    Git-based platform issues work automatically without additional setup.
    CodeRabbit creates issues directly in your repository.
  </Card>
</CardGroup>

<CardGroup cols={2}>
  <Card title="Jira" icon="jira" horizontal="true" href="/integrations/jira">
    Create Jira tickets after configuring the **Jira integration**.
  </Card>

  <Card title="Linear" icon="linear" horizontal="true" href="/integrations/linear">
    Generate Linear issues once you've set up the **Linear integration**.
  </Card>
</CardGroup>

## Best practices

<CardGroup cols={2}>
  <Card title="Provide context" icon="code">
    Include relevant code snippets, error messages, or discussion context when
    requesting issue creation. This helps CodeRabbit generate more detailed and
    actionable issues.
  </Card>

  <Card title="Specify the platform" icon="arrow-pointer">
    If you have multiple issue platforms configured, explicitly mention which one
    to use: "Create a Jira ticket for this" or "Add this to Linear."
  </Card>

  <Card title="Include assignee information" icon="user">
    Mention specific team members who should handle the issue: "Create an issue
    for @username to investigate this performance problem."
  </Card>

  <Card title="Set priority and timing" icon="clock">
    Indicate urgency or deadlines: "Create a high-priority issue for the memory
    leak in checkout flow" or "Add this to the next sprint."
  </Card>
</CardGroup>

For detailed information about configuring issue tracking integrations, see our [Issue Integrations](/integrations/issue-trackers) guide.
