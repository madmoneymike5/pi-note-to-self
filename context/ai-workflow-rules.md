# Development Workflow

## Approach

Build Note to Self incrementally using a written feature specification. Shared context describes the product and rules; the active feature spec limits the current work. Do not infer permission to build the whole product from the overview.

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, end-to-end, verifiable increments.
- Do not combine storage, UI, checkpoint prompting, and unrelated project automation unless the active spec requires their interaction.
- Use the simplest native Pi mechanism that meets the requirement.

## Handling Missing Requirements

If a choice affects storage, model calls, privacy, user-visible behavior, security, dependencies, or release, state the choice and ask Sarah before implementing it. Record the answer in the decision ledger and affected specification/context file.

Tiny reversible details can be decided locally. A missing consequential choice is a blocker, not an invitation to guess.

## Keeping Documents In Sync

Update the relevant context document when architecture, storage, UI behavior, scope, or workflow changes. Update the progress tracker after meaningful work or verification. Keep the ledger factual: record the actual decision, not an invented rationale.

## Worktrees and Commits

The primary checkout is for inspection, integration, fetch, and worktree administration only. All code-changing work happens in a linked worktree created with `git wt add` under `/home/sarah-taylor/Dev/worktrees/`.

Keep one feature unit on its own branch and worktree. Commit the completed unit after its required checks. Integrate with a fast-forward when possible, then push only when Sarah has authorized that push. Remove an integrated clean worktree with `git wt remove`; never delete a registered worktree directory manually. Run `git wt audit` when starting and finishing.

Do not automatically open, merge, or close a pull request. The local review stack and any requested Codie review happen before handoff.

## Verification and Handoff

Apply the test-quality gate before writing or approving checks. Name the observable outcome and the real failure each check catches. Keep offline checks, native Pi checks, and model-quality observations separate.

The current repository review stack is:

1. GitHub Actions native repository check.
2. OpenGrep, Gitleaks, and Trivy blocking checks.
3. Weekly/manual TruffleHog history scan.
4. Kodus and CodeRabbit advisory review.
5. Greptile manual-only when requested.

The stack is CI and review infrastructure, not a release pipeline. Continuous delivery remains unconfigured until an artifact and publication contract exist.

A handoff reports changed files, worktree and branch, commits, checks run, checks not run, limitations, and remaining decisions. Do not claim semantic summary quality from a mock or a single model response.
