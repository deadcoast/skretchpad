# Learnings

> ## Documentation Index
>
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Teach CodeRabbit your review preferences using natural-language chat

For a conceptual overview of CodeRabbit configuration methods, see [Configure CodeRabbit](/guides/configuration-overview). For more information about performing code reviews with CodeRabbit, see [Review pull requests](/guides/code-review-overview).

## About CodeRabbit learnings

As your team works with CodeRabbit, it learns your team's code-review preferences based on chat interactions, and adds these preferences to an internal database that it associates with your Git platform organization. We call these internal records _learnings_.

<img src="https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=2538776ab87cff7e07ce7ce10fe38472" alt="CodeRabbit learnings interface" data-og-width="3126" width="3126" data-og-height="1568" height="1568" data-path="images/guides/assets/images/learnings-chat-demo.png" data-optimize="true" data-opv="3" srcset="https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=280&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=df241e7f28167a6bbcbb68dbb6641751 280w, https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=560&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=9fe0df940e8a29d5b6ae2024b989fa37 560w, https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=840&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=e3482fbf9f69b2098b549fa52b9ab722 840w, https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=1100&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=d96d2e13a04dfa93c0c2540c5f6920ad 1100w, https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=1650&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=2cdf4a34f37fa76c62c1ee24f0944abd 1650w, https://mintcdn.com/coderabbit/8oAyj_Y4qh62mQR0/images/guides/assets/images/learnings-chat-demo.png?w=2500&fit=max&auto=format&n=8oAyj_Y4qh62mQR0&q=85&s=1ea01aae43b28df12dbd5aefc8e78b5e 2500w" />

CodeRabbit learnings are flexible, natural-language statements about code-review preferences whose purpose can include the following:

- Special instructions about reviewing particular files.
- Guidance for reviewing all of the files of one repository.
- Code-review preferences that CodeRabbit must apply across all of your organization's repositories.

<iframe className="w-full aspect-video rounded-xl" src="https://www.youtube.com/embed/Yu0cmmOYA-U" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />

Every time CodeRabbit prepares to add a comment to a pull request or issue, it loads the learnings that apply based on your [configured scope](#specify-the-scope-of-learnings). Depending on your settings, CodeRabbit applies either the repository's learnings only, or all of your organization's learnings. CodeRabbit uses these learnings as additional context or instructions for its comment.

Use learnings for incremental preferences that emerge during code reviews—preferences that don't require a formal configuration change but should be applied to future reviews. Use [review instructions](/guides/review-instructions) or coding guidelines for formal, documented standards.

You can review and edit your organization's CodeRabbit learnings at any time, as detailed later in this page.

## Add learnings

### Adding a learning via comment

To add learnings to the database CodeRabbit keeps about your organization's preferences, communicate your preferences using natural language, in a comment attached to any pull request or issue.

If CodeRabbit decides to create one or more learnings based on a comment, then it makes this explicit in its response to that comment by adding a collapsible section titled **Learnings Added** to its own response comment.

Imagine a scenario where CodeRabbit has reviewed a GitHub-based pull request from your team that adds a feature to an authentication middleware library. CodeRabbit has flagged a certain file as needing improvement, attaching this comment to the relevant lines in its review:

> Consider using nested try-catch blocks here to handle different error scenarios more comprehensively.

If this critique disagrees with your team's coding practices specific to try-catch blocks, then you can reply to this CodeRabbit using a comment of your own, addressed to the `@coderabbitai` service account on GitHub:

> @coderabbitai Actually, we've found that nested try-catch blocks make our auth middleware harder to debug in production. We prefer early returns with specific error codes - it's cleaner and our monitoring tools can track them better.

CodeRabbit considers your reply, and decides to make a learning out of it. It acknowledges this in another reply:

> You're absolutely right about the debugging benefits. Early returns with specific error codes do provide better clarity and monitoring capabilities. I'll remember this preference for your authentication middleware. Thank you for the guidance!

CodeRabbit also adds a **Learnings added** section to this comment, making explicit the fact that this chat has modified its future behavior with your team.

CodeRabbit then creates a new learnings record for itself. Along with metadata such as the pull request number, filename, and GitHub user associated with the learning, CodeRabbit adds this self-instructive text to the new record:

> In authentication middleware, prefer returning early with specific error codes rather than nested try-catch blocks. This improves readability and makes error tracking easier in production environments.

### Add learnings from files

You can import content from any file in your repository as learnings. This is useful for converting existing team documentation into learnings that CodeRabbit will apply during reviews.

To import a file as learnings, mention the file in a pull request comment:

```md theme={null}
@coderabbitai add a learning using docs/coding-standards.md
```

CodeRabbit reads the file contents and creates corresponding learnings. This is useful when:

- Converting existing team documentation into CodeRabbit learnings
- Bulk-adding multiple preferences at once
- Importing learnings from an exported CSV file

<Note>
  If you have AI agent configuration files like `.cursorrules`, `CLAUDE.md`, or
  `.github/copilot-instructions.md`, use [code
  guidelines](/integrations/knowledge-base#code-guidelines:-automatic-team-rules)
  instead. CodeRabbit automatically detects and applies these files without
  manual import.
</Note>

### Best practices for new learnings

When communicating with CodeRabbit during an active code review, follow these practices to create effective learnings:

#### Consider if it's a pattern or a one-off

Determine whether a correction represents a team-wide preference that should apply to all future reviews, or a situation specific to this pull request.

Not every correction should become a learning. For one-time exceptions, such as unusual temporary code patterns during a migration, resolve the comment without creating a learning. For systemic preferences that should persist across reviews, provide feedback that CodeRabbit can store as a learning.

#### Explain the why, not just the what

Don't just tell CodeRabbit what to do, explain the reasoning. The "why" helps CodeRabbit apply the learning correctly in similar-but-not-identical situations:

<CodeGroup>
  ```md Less effective theme={null}
  @coderabbitai Don't suggest adding user IDs to error messages.
  ```

```md More effective theme={null}
@coderabbitai We intentionally keep user IDs out of error messages
because they end up in logs that get shipped to third-party monitoring.
We track user context separately via our tracing system instead.
```

</CodeGroup>

#### Reply to specific comments for maximum context

Prefer to reply directly to the comment on the specific line of code rather than leaving general comments on the PR. This gives CodeRabbit more context when considering feedback, allowing it to create more specific learnings.

A generic comment on the PR might produce a vague learning. Replying to a specific line produces a learning tied to that file pattern and context.

## View learnings

To view the learnings that CodeRabbit has associated with your organization, follow these steps:

1. Visit [the CodeRabbit web interface](https://app.coderabbit.ai/settings/repositories).

2. In the sidebar, click **Learnings**.

This displays a paged list of all of the learnings associated with your organization, sorted by creation time, newest-first. To see more details about any learnings record, click its text.

### Filter displayed learnings

Over time, the learnings that CodeRabbit gathers for your organization can become quite numerous. This can make manually browsing the full list difficult. The CodeRabbit web interface has search and filtering tools to help you find specific learnings, based on the topic of the learning text, or on other metadata.

To filter the displayed learnings by topic or concept, enter that topic or concept into the **Similarity search** field, and set **Top K** to the number of results you want returned. Because this is a vector-based similarity search, the returned learnings don't necessarily contain the exact text of your search terms.

For example, to see the top ten learnings that have to do with error reporting, enter `error reporting` into **Similarity search** and set **Top K** to `10`. This will find learnings about exceptions, try-catch, error codes, and other semantically related topics.

To filter the displayed learnings by repository, user, or file path, click **+ Filters**, and select additional criteria.

### Edit or delete learnings

You can edit and delete learnings in two ways:

**Via the web interface**: If your account has the **Admin** [CodeRabbit role](/guides/roles) with your organization, then you can freely edit the text of any stored learning, or delete it outright through the CodeRabbit dashboard.

To edit or delete a learning via the web interface:

1. Click the **Action** menu on the learning record, which resembles three dots.

2. Select **Edit** or **Delete**.

**Via CodeRabbit comments**: Any user can request learning modifications through natural language comments in pull requests or issues. Ask CodeRabbit to remove or modify specific learnings by mentioning `@coderabbitai` and describing the change you want.

## Export and transfer learnings

You can export your organization's learnings and import them into another CodeRabbit account. This is useful when migrating accounts or consolidating organizations.

### Export learnings

To export your learnings:

1. Visit [the CodeRabbit web interface](https://app.coderabbit.ai).
2. Navigate to **Learnings** in the sidebar.
3. Click the export option to download your learnings as a CSV file.

The CSV file contains all your learnings with their associated metadata, including the repository, file path, and learning text.

### Import learnings to a new account

To import learnings into a new CodeRabbit account:

1. Ensure the new account is connected to your repository and has an active CodeRabbit subscription.

2. Add the exported learnings CSV file to a branch in your repository.

3. Create a pull request from that branch.

4. Use CodeRabbit chat to request the import:

```md theme={null}
@coderabbitai import file my_learnings.csv as Learnings data for future use
```

CodeRabbit will process the CSV file and import your previous learnings into the new environment.

## Configure learnings storage and application

CodeRabbit has several configuration options that modify the storage and application of learnings.

### Opt out of learnings storage

CodeRabbit enables learnings by default. To disable learnings, modify one of the following configuration options:

- To disable all CodeRabbit [knowledge base](/integrations/knowledge-base) features for your organization or repository, which includes learnings, enable [the _Opt out_ setting](/reference/configuration#opt-out).

- To disable all CodeRabbit features that require long-term data retention about your organization's use of CodeRabbit—including learnings—disable [the _Data retention_ setting](/reference/configuration#data-retention).

<Warning>
  Disabling data retention immediately and irrevocably deletes all learnings
  that CodeRabbit has associated with your organization.
</Warning>

### Specify the scope of learnings

[The Learnings configuration setting](/reference/configuration#learnings) lets you specify the _scope_ that CodeRabbit applies to all of the learnings it has collected about your organization. You can set this option to one of the following values:

- **`auto`** _(default)_: When reviewing a public repository, CodeRabbit applies only the learnings specific to that repository. When reviewing private repository, CodeRabbit applies all of your organization's learnings. This is the default setting.
- **`global`**: CodeRabbit applies all of your organization's learnings to all code reviews.
- **`local`**: CodeRabbit applies only learnings associated with code reviews' respective repositories.

### When to use each scope

The default `auto` scope can be suboptimal for organizations with diverse repositories. Consider these scenarios:

> Use 'local' for diverse tech stacks":
>
> > If your organization has repositories with different conventions—such as a Python backend and a React frontend—use `local` scope to prevent cross-contamination of learnings.
> > Without `local` scope, learnings about Python exception handling might incorrectly influence React component reviews, or vice versa.

```yaml .coderabbit.yaml theme={null}
knowledge_base:
  learnings:
  scope: 'local'
```

> Use 'global' for consistent org-wide standards":
>
> > If your organization maintains consistent coding standards across all repositories—such as security practices, documentation requirements, or naming conventions—use `global` scope to apply learnings universally.

```yaml .coderabbit.yaml theme={null}
knowledge_base:
  learnings:
  scope: 'global'
```

> Use 'auto' for mixed visibility":
>
> > The `auto` setting works well when you have both public and private repositories, and you want to:
> >
> > - Keep public repository learnings isolated
> > - Share learnings across private repositories

- This is the default behavior and requires no configuration.

## Troubleshooting

### Learnings appear to not be working

If CodeRabbit seems to ignore your learnings—for example, continuing to make suggestions that contradict existing learnings—try this workaround:

1. **Review existing learnings.** Go to your project's Learnings page and verify that all relevant learnings are active and clearly phrased.

2. Consider possible conflicts with path instructions or coding guidelines. Path instructions precede learnings.

3. **Add a reinforcement rule.** Introduce a new rule that explicitly tells the model to stop and reconsider the Learnings before continuing the review. For example:

   ```
   “Before responding, review all Learnings to ensure none are ignored.”
   ```

4. **Save and re-test.** Commit this change and observe the next few automated reviews. CodeRabbit should now respect the learnings more consistently.

This situation can occur when the model deprioritizes certain learnings due to contextual overlap or conflicting instructions. The reinforcement rule prompts the model to stop and reassess learnings before proceeding.

### Maintaining learnings over time

Team conventions evolve, and learnings can become stale. To maintain learnings effectively:

- **Quarterly review.** Set a reminder to review your learnings every quarter. Look for learnings that reference deprecated patterns, old file structures, or outdated team decisions.
- **Delete contradictory learnings.** If you find learnings that conflict with current practices, delete them to avoid confusing CodeRabbit.
- **Update rather than accumulate.** When team standards change, update or delete old learnings rather than adding new ones that contradict them. Multiple conflicting learnings on the same topic can produce inconsistent behavior.

To identify outdated learnings:

1. Use the similarity search to find learnings about areas where your practices have changed.
2. Filter by creation date to find the oldest learnings.
3. Review learnings from team members who are no longer active.

## What's next

- [Add review instructions](/guides/review-instructions) for formal, path-based rules
- [Configure the knowledge base](/integrations/knowledge-base) for broader context integration
- [Set up issue tracking integration](/integrations/issue-trackers) for linked issue context
