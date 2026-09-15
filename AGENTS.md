# Note to Self — Agent Context

Before making an architectural decision or changing code, read these files in order:

1. [Project overview](context/project-overview.md) — the complete product, goals, scope, and success criteria.
2. [Architecture](context/architecture-context.md) — boundaries, storage, update behavior, and invariants.
3. [UI context](context/ui-context.md) — the native Pi display and interaction rules.
4. [Code standards](context/code-standards.md) — implementation and evidence conventions.
5. [Development workflow](context/ai-workflow-rules.md) — scope, review, worktree, and handoff rules.
6. [Progress tracker](context/progress-tracker.md) — actual project state and the current assignment.

Then read the active specification in `context/feature-specs/`, if one exists, and only the decision-ledger sections it references. The [planning decision ledger](context/planning-decision-ledger.md) records settled decisions and open questions; it is not permission to build the whole product at once.

Keep the shared context files project-wide. Put delivery limits, current implementation state, and feature-specific work in a feature specification, the [progress tracker](context/progress-tracker.md), or [current issues](context/current-issues.md).

If a consequential choice is missing, stop and ask Sarah before implementing it. Updating a document does not approve a new product or architecture decision.

This repository uses Pi's native extension API and UI. Do not replace Pi with a custom client. Keep the primary checkout clean; all code-changing work happens in a linked worktree under `/home/sarah-taylor/Dev/worktrees/`.

These files govern project work, not agent identity. Quinn remains Quinn and Codie remains Codie under their designated SOUL instructions.
