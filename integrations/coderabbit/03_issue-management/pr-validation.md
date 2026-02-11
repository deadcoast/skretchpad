# PR Validation using Linked Issues

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> CodeRabbit provides intelligent assessment of linked issues to validate whether pull requests properly address their requirements. This guide explains how to effectively use linked issues and write clear issue descriptions for optimal results.

<Note>
  To use linked issues with Jira or Linear, you must first enable the
  corresponding integration. Note that these integrations are enabled for
  private repositories by default, but disabled for public repositories. See
  [Issue trackers](/integrations/issue-trackers) for setup instructions.
</Note>

## Understanding linked issues

A linked issue is one that is explicitly referenced in your pull request description using platform-specific syntax:

<CodeGroup>
  ```bash GitHub theme={null}
  fixes #123
  closes #123
  resolves #123
  ```

  ```bash GitLab theme={null}
  closes #123
  fixes #123
  https://gitlab.com/org/repo/-/issues/123
  ```

  ```bash Jira/Linear theme={null}
  https://company.atlassian.net/browse/PROJ-123
  https://linear.app/company/issue/DEV-123
  ```
</CodeGroup>

When CodeRabbit detects linked issues, it analyzes them against your pull request changes to determine if the requirements are met:

<Frame caption="A well-structured Linear issue with clear acceptance criteria">
  <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a62e80b427e4a1fbb67c116319bbdda1" alt="Example of a linked Linear issue with summary, technical notes, and acceptance criteria" data-og-width="1688" width="1688" data-og-height="912" height="912" data-path="assets/images/linked-linear-issue.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=a359186786fc39ecd4bdd14cdded6cd8 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=aefa488d5265e5b4fe9f7eb8402fd807 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=d1df3db54cfee5277aeb2d735370cfe2 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=ba533ed76d795ff0d3f945a34137031c 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=95f82449d4d71d055747d17cbc274c0e 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-linear-issue.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=b528ccaca8e4dcf06470966407605d3d 2500w" />
</Frame>

If a requirement from the linked issue isn't addressed, CodeRabbit flags it during review:

<Frame caption="CodeRabbit identifies a missing requirement from the linked issue">
  <img src="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=c0be7c037861feae1b85aa585125c437" alt="CodeRabbit review comment showing a potential issue where a linked issue requirement was not addressed" data-og-width="1512" width="1512" data-og-height="472" height="472" data-path="assets/images/linked-issue-criteria-failed.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=280&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=92941e3d9dff4d38aa473af4fa5d37af 280w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=560&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=6488764d98f18b96da815b52ac0c97f2 560w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=840&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=1009f109966a4d554349d11af064193f 840w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=1100&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=dc2367ef4e7e46d2ec8b1539b8b33c62 1100w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=1650&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=3c02922d535acbbd4ff4f6741b3485ed 1650w, https://mintcdn.com/coderabbit/0_UNDuRPehZvImxS/assets/images/linked-issue-criteria-failed.png?w=2500&fit=max&auto=format&n=0_UNDuRPehZvImxS&q=85&s=e9c81f09610bcd3fdd6d2b5afaf110f8 2500w" />
</Frame>

## Best practices for issue writing

### Issue titles

Create descriptive, technical titles that clearly state the goal:

<Tabs>
  <Tab title="Good examples">
    * "Add PrismaLint integration to configuration flow"
    * "Fix race condition in user authentication"
    * "Implement caching for GraphQL queries"
  </Tab>

  <Tab title="Poor examples">
    * "Fix bug"
    * "Update code"
    * "Improve performance"
  </Tab>
</Tabs>

### Issue descriptions

Write comprehensive descriptions that provide clear technical context:

<Steps>
  <Step title="Problem statement">
    * Clearly describe what needs to be changed
    * Include technical details about affected components
    * Reference specific files or functions if known
  </Step>

  <Step title="Expected solution">
    * Outline the desired implementation approach
    * Include code examples or pseudo-code when relevant
    * List specific acceptance criteria
  </Step>
</Steps>

**Example description:**

```markdown  theme={null}
Problem:
The configuration system doesn't validate Prisma schema files before deployment,
leading to potential runtime errors.

Solution:
Integrate PrismaLint into the configuration flow to:

- Validate schema files during PR checks
- Enforce consistent naming conventions
- Prevent common Prisma anti-patterns

Affected Components:

- Configuration validation pipeline
- CI/CD workflow
- Schema validation logic

Acceptance Criteria:

- [ ] PrismaLint runs on all PR checks
- [ ] Failed validations block merging
- [ ] Clear error messages for schema issues
```

### Consistent terminology

Use consistent terminology between issues and pull requests:

<Tabs>
  <Tab title="Good practices">
    * Use the same technical terms consistently
    * Reference components with their exact names
    * Maintain consistent naming patterns
  </Tab>

  <Tab title="Poor practices">
    * Mixing different terms for the same component
    * Using vague or non-technical language
    * Inconsistent capitalization or formatting
  </Tab>
</Tabs>

## Linking issues effectively

### In pull requests

<Tabs>
  <Tab title="Direct references">
    ```md  theme={null}
    Fixes #123
    Resolves organization/repo#456
    Closes https://github.com/org/repo/issues/789
    ```
  </Tab>

  <Tab title="Multiple issues">
    ```md  theme={null}
    This PR addresses:
    - Fixes #123
    - Closes #456
    - Resolves https://jira.company.com/browse/PROJ-789
    ```
  </Tab>
</Tabs>

### Cross-references

For better traceability:

<Steps>
  <Step title="Add PR references in issue comments">
    Link back to the pull request from the issue discussion
  </Step>

  <Step title="Use complete URLs for external systems">
    Include full URLs when referencing Jira, Linear, or other platforms
  </Step>

  <Step title="Maintain bidirectional links">
    Ensure related issues reference each other for complete context
  </Step>
</Steps>

## How CodeRabbit assesses linked issues

CodeRabbit evaluates linked issues through this process:

> STEP 1: "Analyze issue content"
* Reviews issue titles and descriptions for requirements and context

> STEP 2: "Compare PR changes"
* Examines the code changes in the pull request

> STEP 3: "Validate requirements"
* Determines if the changes meet the stated objectives

> STEP 4: "Provide assessment"
* Returns one of three possible outcomes:
  * ✅ **Addressed**: Objective completed (no explanation needed)
  * ❌ **Not addressed**: Objective not met (explanation provided)
  * ❓ **Unclear**: Uncertain if objective is met (explanation provided)

> [!NOTE]
> Only the issue title and description are considered in the assessment.
> Comments and discussion threads are not currently analyzed.

## Tips for better assessments

<CardGroup cols={2}>
  <Card title="Be specific">
    * Include clear, measurable objectives
    * List specific technical requirements
    * Reference affected code components
  </Card>

  <Card title="Provide context">
    * Explain why changes are needed
    * Document current behavior
    * Describe expected outcomes
  </Card>

  <Card title="Use technical details">
    * Include file paths when known
    * Reference specific functions or classes
    * Mention relevant technologies
  </Card>

  <Card title="Keep it focused">
    * One main objective per issue
    * Clear scope boundaries
    * Specific acceptance criteria
  </Card>
</CardGroup>

## Related resources

<CardGroup cols={3}>
  <Card title="Review instructions" href="/guides/review-instructions">
    Learn how to add custom instructions to your reviews
  </Card>

  <Card title="Issue creation" href="/issues/creation">
    Automatically create issues from PR reviews
  </Card>

  <Card title="Issue trackers" href="/integrations/issue-trackers">
    Set up Jira or Linear integrations for linked issues
  </Card>
</CardGroup>
