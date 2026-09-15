# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes instead of adding caller-specific patches.
- Do not add a generic framework for one extension.
- Build the smallest complete approved slice.
- Do not simplify away security, data protection, accessibility, validation, or error handling.
- Keep generated summaries, deterministic evidence, UI state, and storage logic separate.

## TypeScript

- Use strict TypeScript.
- Avoid `any`; validate unknown data at boundaries.
- Prefer explicit interfaces for stored records and tool contracts.
- Match the installed Pi API version and document the supported version in the feature specification.
- Use native Node APIs and existing dependencies before adding packages.

## Pi Extension Runtime

- Use Pi's native extension loader, lifecycle hooks, commands, widgets, custom UI, and active model.
- Keep handlers thin and move storage, event classification, checkpoint prompts, and rendering into focused modules.
- Use `ctx.sessionManager` for session identity and current tree position.
- Use `pi.appendEntry()` only for explicit TUI-only provenance that should remain in the session; do not put operational state into hidden LLM messages by default.
- Do not edit Pi internals, credentials, identity instructions, or other extensions.
- Guard TUI-only features with `ctx.mode === "tui"` and provide useful non-TUI behavior where the feature contract requires it.

## UI and Interaction

- Follow [UI context](ui-context.md).
- Use native Pi theme and keybindings.
- Keep the whole persistent widget clickable only where mouse capture exists; retain keyboard access everywhere.
- Render `Blocker: NONE` when the user enabled the blocker field and no blocker exists.
- Never use color or an icon as the only status signal.

## Commands and Tools

- Register both `/nts` and `/note-to-self` against the same command behavior.
- Validate command arguments before mutation.
- Keep `work_update` limited to generated fields; it must not accept a project path or overwrite the human note.
- Automatic checkpoint requests must be bounded, cancelable where applicable, and unable to loop forever.
- A failed checkpoint must report stale or pending state rather than success.

## Data and Storage

- Separate human-authored and generated data in the schema.
- Use schema versions and atomic replacement writes.
- Preserve unknown fields when safe, and report malformed files without destroying them.
- Use private file permissions where supported.
- Do not store raw transcripts, credentials, or provider tokens.
- Use stable project identity and session/leaf identity; do not key state only by display name.

## Repository and Delivery

- Keep the primary checkout clean.
- Do code-changing work in a linked worktree under `/home/sarah-taylor/Dev/worktrees/`.
- Use the central review stack. GitHub Actions are CI; advisory bots do not replace local review.
- Do not automatically open, merge, or close pull requests.
- Do not configure continuous delivery before Feature Spec #15 approves the release-readiness/publication contract and Feature Spec #16 is approved for implementation.
- Treat the first CD workflow as a manually approved delivery gate unless a later decision explicitly authorizes automatic deployment.

## Test Quality and Evidence

Apply the `test-quality` skill before adding or approving any test or test-like check. Keep each check only when it catches a plausible failure or protects a user-facing contract. State the failure it catches.

Use focused offline checks for storage, state transitions, validation, stale handling, and hook wiring. Use native Pi dogfood for UI and lifecycle behavior. Do not claim that mocked model output proves semantic summary quality.
