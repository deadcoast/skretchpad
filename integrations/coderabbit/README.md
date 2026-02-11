# CodeRabbit Integration Mirror

This directory contains a local mirror/snapshot of CodeRabbit documentation and reference material used by this repository.

## Numbered Directories (`03_`, `04_`, `05_`)

The numbered paths are intentionally preserved:

- `03_issue-management`
- `04_configuration`
- `05_knowledge-base`

Reason:

- They match the upstream source structure.
- Existing deep links and historical references already target these paths.
- Renaming them creates avoidable drift and broken references during syncs.

CI now validates that these canonical snapshot directories exist.

## Friendly Aliases

If you prefer non-numbered navigation, use:

- `integrations/coderabbit/issue-management/`
- `integrations/coderabbit/configuration/`
- `integrations/coderabbit/knowledge-base/`

These are lightweight alias docs that point back to the canonical numbered paths.
