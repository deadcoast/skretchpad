# Code review commands

> ## Documentation Index
> Fetch the complete documentation index at: <https://docs.coderabbit.ai/llms.txt>
> Use this file to discover all available pages before exploring further.
>
> Complete reference of CodeRabbit commands for controlling code reviews, generating documentation, and managing pull requests.

<Note>
  All commands must be used with the `@coderabbitai` mention in PR comments or
  descriptions to trigger CodeRabbit's response.
</Note>

## Review control commands

These commands control CodeRabbit's automatic review behavior for your pull request.

### Manual review triggers

<AccordionGroup>
  <Accordion title="@coderabbitai review" icon="refresh-cw">
    **Description:** Triggers an incremental review of new changes only

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Automatic reviews are disabled
    * You want to manually request a review of recent changes
    * You've made updates and want focused feedback on new code

    **Example:**

    ```
    @coderabbitai review
    ```
  </Accordion>

  <Accordion title="@coderabbitai full review" icon="scan">
    **Description:** Performs a complete review of all files from scratch

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * You want fresh insights on the entire PR
    * Previous reviews may have missed something
    * You've made significant changes affecting the overall logic

    **Example:**

    ```
    @coderabbitai full review
    ```
  </Accordion>
</AccordionGroup>

### Review flow control

<AccordionGroup>
  <Accordion title="@coderabbitai pause" icon="pause">
    **Description:** Temporarily stops automatic reviews on the PR

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Making multiple rapid changes
    * Want to avoid review spam during development
    * Need time to complete your implementation

    **Example:**

    ```
    @coderabbitai pause
    ```
  </Accordion>

  <Accordion title="@coderabbitai resume" icon="play">
    **Description:** Restarts automatic reviews after a pause

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Ready for CodeRabbit to review again
    * Completed your changes and want feedback

    **Example:**

    ```
    @coderabbitai resume
    ```
  </Accordion>

  <Accordion title="@coderabbitai ignore" icon="x-circle">
    **Description:** Permanently disables automatic reviews for this PR

    **Usage:** Add anywhere in the pull request description

    **When to use:**

    * Want to handle the review process manually
    * PR contains sensitive or experimental code
    * Working on a hotfix that needs immediate deployment

    **Example:**

    ```
    @coderabbitai ignore
    ```

    <Warning>
      This command must be placed in the PR description, not in comments. To re-enable reviews, remove this text from the description.
    </Warning>
  </Accordion>
</AccordionGroup>

## Content generation commands

These commands help generate and update PR content and documentation.

### Summary and documentation

<AccordionGroup>
  <Accordion title="@coderabbitai summary" icon="file-text">
    **Note:** This is not a command - it's a placeholder that you put in your PR description.

    **Description:** A placeholder in your PR description that gets replaced with CodeRabbit's high-level summary of the changes

    **How it works:**

    1. Add `@coderabbitai summary` anywhere in your PR description
    2. When CodeRabbit generates a summary, it replaces this placeholder instead of appending to the end
    3. You can customize this placeholder using the `reviews.high_level_summary_placeholder` configuration option

    **Usage:** Place directly in your PR description (not as a comment)

    **When to use:**

    * You want the summary in a specific location in your description
    * You want to control where the summary appears instead of it being appended at the end

    **Example PR description:**

    ```
    ## Overview
    This PR implements the new user authentication flow.

    @coderabbitai summary

    ## Testing
    - [ ] Unit tests pass
    - [ ] Integration tests pass
    ```

    <Info>
      You can change this placeholder to anything you like using the `reviews.high_level_summary_placeholder` configuration option. See the [configuration reference](/reference/configuration#param-high-level-summary-placeholder) for more details.
    </Info>
  </Accordion>

  <Accordion title="@coderabbitai generate docstrings" icon="book">
    **Description:** Generates docstrings for functions and classes in the PR

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Code lacks proper documentation
    * Want consistent docstring formatting
    * Need to improve code documentation quickly

    **Example:**

    ```
    @coderabbitai generate docstrings
    ```

    <Note>
      This feature must be enabled in your CodeRabbit configuration under `reviews.finishing_touches.docstrings.enabled`.
    </Note>
  </Accordion>

  <Accordion title="@coderabbitai generate unit tests" icon="test-tube">
    **Description:** Generates unit tests for the code in the PR

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Code lacks test coverage
    * Want to quickly scaffold test cases
    * Need examples of how to test your functions

    **Example:**

    ```
    @coderabbitai generate unit tests
    ```

    <Note>
      This feature must be enabled in your CodeRabbit configuration under `reviews.finishing_touches.unit_tests.enabled`.
    </Note>
  </Accordion>

  <Accordion title="@coderabbitai generate sequence diagram" icon="workflow">
    **Description:** Creates a sequence diagram visualizing the PR's history and changes

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Want to visualize complex interactions
    * Need to understand the flow of changes
    * Documentation requires visual aids

    **Example:**

    ```
    @coderabbitai generate sequence diagram
    ```
  </Accordion>
</AccordionGroup>

## Comment management

<AccordionGroup>
  <Accordion title="@coderabbitai resolve" icon="circle-check">
    **Description:** Marks all CodeRabbit review comments as resolved

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Addressed all CodeRabbit feedback
    * Want to clean up resolved issues
    * Ready to merge and need clean comment state

    **Example:**

    ```
    @coderabbitai resolve
    ```

    <Warning>
      This will resolve ALL CodeRabbit comments. Make sure you've actually addressed the feedback before using this command.
    </Warning>
  </Accordion>
</AccordionGroup>

## Information and configuration

<AccordionGroup>
  <Accordion title="@coderabbitai configuration" icon="settings">
    **Description:** Displays current CodeRabbit configuration settings

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Need to check current settings
    * Troubleshooting configuration issues
    * Want to export or share your configuration

    **Example:**

    ```
    @coderabbitai configuration
    ```
  </Accordion>

  <Accordion title="@coderabbitai help" icon="circle-question-mark">
    **Description:** Shows a quick reference guide of available commands

    **Usage:** Post as a comment in your pull request

    **When to use:**

    * Need a quick reminder of available commands
    * Want to see command syntax
    * Sharing CodeRabbit capabilities with team members

    **Example:**

    ```
    @coderabbitai help
    ```
  </Accordion>
</AccordionGroup>

## Command reference table

For quick reference, here's a summary of all available commands:

| Command                                   | Type       | Description                       | Location       |
| ----------------------------------------- | ---------- | --------------------------------- | -------------- |
| `@coderabbitai review`                    | Review     | Incremental review of new changes | PR comment     |
| `@coderabbitai full review`               | Review     | Complete review from scratch      | PR comment     |
| `@coderabbitai pause`                     | Control    | Temporarily stop reviews          | PR comment     |
| `@coderabbitai resume`                    | Control    | Restart reviews after pause       | PR comment     |
| `@coderabbitai ignore`                    | Control    | Permanently disable reviews       | PR description |
| `@coderabbitai summary`                   | Content    | Regenerate PR summary             | PR comment     |
| `@coderabbitai generate docstrings`       | Content    | Generate function documentation   | PR comment     |
| `@coderabbitai generate unit tests`       | Content    | Generate test cases               | PR comment     |
| `@coderabbitai generate sequence diagram` | Content    | Create visual diagram             | PR comment     |
| `@coderabbitai resolve`                   | Management | Resolve all CR comments           | PR comment     |
| `@coderabbitai configuration`             | Info       | Show current settings             | PR comment     |
| `@coderabbitai help`                      | Info       | Show command reference            | PR comment     |

## Related configuration

Many of these commands are affected by your CodeRabbit configuration. Key configuration options include:

* **Automatic reviews**: `reviews.auto_review.enabled`
* **Docstring generation**: `reviews.finishing_touches.docstrings.enabled`
* **Unit test generation**: `reviews.finishing_touches.unit_tests.enabled`
* **High-level summaries**: `reviews.high_level_summary`
* **Sequence diagrams**: `reviews.sequence_diagrams`

For complete configuration options, see [Configuration Reference](/reference/configuration).
