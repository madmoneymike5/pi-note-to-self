# Note to Self Planning Decision Ledger

**Status:** Planning is active. This is a durable record of decisions and open questions, not permission to implement the whole product.

## 1. Product goal

Note to Self helps Sarah resume work across many projects and Pi chats by keeping one trusted human note and a clearly labeled project/session progress view inside Pi.

## 2. Product and repository

- Product name: **Note to Self**.
- Local repository: `/home/sarah-taylor/Dev/pi-note-to-self`.
- GitHub repository: `madmoneymike5/pi-note-to-self`.
- GitHub visibility: public, chosen by Sarah during bootstrap.
- The source repository is public; local notes and workstream data remain local.
- Package name, license, registry, and release version are not decided.

## 3. Commands and display

- Primary short command: `/nts`.
- Full command alias: `/note-to-self`.
- Manual refresh command: `/checkpoint`.
- First run opens the expanded card.
- Later launches remember the user's compact or expanded choice.
- The persistent widget is part of Pi's normal layout and does not cover the transcript.
- The compact and expanded forms are states of the same widget.
- The whole widget toggles when mouse input is available; keyboard and commands remain the fallback.

## 4. Compact fields

The available compact fields are latest completed item, current task, next step, blocker, and human note. The user can enable, disable, and reorder them. At most four appear in one line. The default begins `done → current task → next`.

An enabled blocker is always shown. When clear, its value is `Blocker: NONE`; it is not treated as an empty field.

## 5. Progress updates

- Sarah accepted automatic plus manual updating.
- Deterministic Pi events mark a workstream changed.
- Meaningful changes may trigger one bounded semantic checkpoint using the active Pi model.
- `/checkpoint` requests one immediately.
- The extension must show pending or stale state when a checkpoint is missing or ignored.
- Exact event classification, cooldown, and model-call budget remain open for the first feature specification.

## 6. Data boundaries

- Human note is authoritative and never overwritten by the agent.
- Project identity is separate from session/branch identity.
- Raw transcripts and raw tool output are not the primary stored summary.
- Local storage is primary; Chronicle is not the live operational store.
- No credentials, tokens, or private provider configuration are copied into the repository or Chronicle.

## 7. Repository delivery

- The central review stack is enabled.
- GitHub Actions provide CI and blocking security checks.
- Kodus and CodeRabbit are advisory; Greptile is manual-only.
- TruffleHog is weekly/manual and separate from pull-request checks.
- Continuous delivery is not configured because there is no approved release artifact.
- Automatic pull-request creation, merging, and closing are not enabled.
- CD is a separate product-delivery concern from the review stack and CI.

## 8. Open decisions

- Any future changes to the approved Feature Spec #1 scope or its accepted verification evidence.
- Any future change to the approved Feature Spec #2 storage boundary, privacy, locking, or recovery policy.
- Exact deterministic trigger list and checkpoint cooldown/retry rules.
- Whether the human note is sent to the active model by default.
- Full settings UI and project-shelf command grammar.
- Package, license, release, registry, and future publication policy.
- Whether a curated checkpoint may later be exported to Chronicle.

## 9. Feature Spec #1 planning inputs

Sarah selected and approved these inputs for Feature Spec #1:

- Target Pi compatibility: exact installed development and smoke-test target `@earendil-works/pi-coding-agent` `0.85.1`.
- Node floor: `>=22.19.0`, inherited from Pi `0.85.1`'s engine requirement.
- Package manager: npm with a committed `package-lock.json` and clean-install verification.
- Tooling shape: strict TypeScript, Node's built-in test runner, ESLint with TypeScript support, and a truthful build/check path that typechecks and dry-runs package assembly without committing to an emitted `dist` artifact.
- Development package remains private and is not a publication or CD decision.

Feature Spec #1 is **Implemented, reviewed, and merged**. It was implemented on `feature-01-extension-foundation`, reviewed through [PR #1](https://github.com/madmoneymike5/pi-note-to-self/pull/1), and merged into `main` at `574ca5d`. The PR's Review Stack, CodeRabbit, and Kodus checks completed successfully after the review fixes. The implementation worktree was removed after integration.

The foundation remains intentionally limited to package/runtime compatibility and verification; storage, UI, workstreams, checkpoints, installation, release, and CD remain future feature work.

## 10. Feature Spec #2 planning inputs

Feature Spec #2 is approved. Its inputs are:

- Project identity uses the canonical Git common-directory path directly so linked worktrees share one project record, including repositories with separate Git directories; the current worktree root is transient metadata for later workstream logic. Outside Git, identity falls back to canonical cwd. The key is the lowercase SHA-256 hash of the domain-separated `git-common:` or `cwd:` input.
- Storage is machine-local under `$PI_CODING_AGENT_DIR/note-to-self/`, falling back to `~/.pi/agent/note-to-self/`, and uses private per-project JSON files rather than a database or project-local files.
- Human note content is a separate `note.md`; generated state cannot overwrite it.
- Concurrent mutations use the simplest safe shared-session boundary: a five-second per-project exclusive lock plus same-directory atomic replacement. Lock timeouts fail closed; stale-lock reclamation, journals, and semantic merge are not proposed.
- Version 1 is the only schema in the initial slice. Malformed or newer unsupported records are preserved and fail closed; the initial slice does not auto-reset to empty state, add migrations without a real version-2 contract, or build repair UX.
- Implementation remains paused: Sarah's explicit start instruction is required before creating the implementation worktree.

## 11. Approved feature-spec sequencing for release

Sarah approved separating the release work into two later feature specifications:

- **Feature Spec #13 — Installation, Upgrade & Local Distribution:** keep this focused on local installation and upgrade behavior.
- **Feature Spec #14 — End-to-End Dogfood & Acceptance:** verify the product before release work.
- **Feature Spec #15 — Release Readiness & Publication Contract:** decide the package format, license, versioning, registry, installation/upgrade contract, permissions, rollback, and release gates.
- **Feature Spec #16 — Configure CD & Publish First Version:** implement the release workflow, build and verify the artifact, require explicit human approval, publish the first version, and verify installation from the published source.

The initial CD design is Continuous Delivery with a manual publish gate. Automatic deployment on every merge is not approved. The actual package, registry, version, credentials, and publication details remain open until Feature Spec #15.

## 12. Decision rule

The latest explicit answer from Sarah wins. A working suggestion is not a settled decision. If an open choice is consequential, stop and ask before affected implementation.
