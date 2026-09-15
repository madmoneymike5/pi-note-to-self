# Feature Specification 01 — Extension Foundation & Compatibility

**Status:** Draft — awaiting Sarah's approval
**Product:** Note to Self
**Proposed implementation branch:** `feature-01-extension-foundation`
**Proposed implementation worktree:** `/home/sarah-taylor/Dev/worktrees/pi-note-to-self--f913adf4/feature-01-foundation`
**Authoring worktree:** `spec-01-foundation` (documentation only)

This document defines the first implementation slice. It is not approval to implement until Sarah explicitly approves this draft.

## 1. Purpose

Create the smallest real Pi extension project that can be installed locally, typechecked, linted, tested, packaged for inspection, and loaded by the installed Pi runtime.

This slice establishes the extension's compatibility and delivery boundary. It does not implement Note to Self behavior yet.

## 2. Context and Dependencies

Read and apply:

- [Project overview](../project-overview.md)
- [Architecture context](../architecture-context.md)
- [UI context](../ui-context.md)
- [Code standards](../code-standards.md)
- [Development workflow](../ai-workflow-rules.md)
- [Progress tracker](../progress-tracker.md)
- [Planning ledger — Sections 2, 7, 8, 9, and 11](../planning-decision-ledger.md)

This slice has no product-feature dependency. It is blocked by this specification's approval and by any consequential choice not settled below.

## 3. User/System Outcome

A clean checkout can be installed with npm and can prove all of the following without touching Sarah's global Pi configuration or requiring a model request:

1. The declared dependencies are present and reproducible from the lockfile.
2. The extension source is valid strict TypeScript for the target Pi API.
3. The repository's lint, focused test, package check, and native Pi load check are truthful commands rather than placeholders.
4. Pi can load the extension entry point using the normal `--extension` mechanism.
5. No Note to Self user behavior is claimed or accidentally exposed by the foundation.

## 4. Settled Foundation Choices

These choices were selected for this draft:

- **Pi target:** exact development and smoke-test target `@earendil-works/pi-coding-agent` version `0.85.1`.
- **Node floor:** `>=22.19.0`, matching Pi `0.85.1`'s declared engine requirement.
- **Package manager:** npm with a committed `package-lock.json`; CI uses a clean install.
- **Module format:** ESM (`"type": "module"`) with NodeNext resolution.
- **TypeScript baseline:** strict mode, ES2023 target/lib, NodeNext module/module resolution, Node types, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`, and no emitted JavaScript in the typecheck path.
- **Test runner:** Node's built-in `node:test` runner with TypeScript stripping supported by the Node floor; no test framework is added for this slice.
- **Lint:** local ESLint with TypeScript support, installed as project tooling rather than relying on a global executable.
- **Build/check shape:** the build command typechecks and dry-runs package assembly; it does not create a `dist` directory or settle the eventual published artifact.
- **Package safety:** the development package remains private. Feature Spec #15 owns the eventual public package name, artifact, registry, and publication contract.
- **Pi package entry:** the manifest declares the extension entry under the Pi package manifest and points to the source entry point. Pi core packages are not bundled into the extension package.

Exact compatible versions for TypeScript, ESLint, the TypeScript ESLint integration, and Node type definitions may be selected during implementation, then pinned in `package-lock.json`. Changing the Pi target, package manager, module model, runtime dependency policy, or emitted-artifact decision requires returning to Sarah.

## 5. In Scope

### 5.1 Project manifest and dependency lock

Add the minimum project manifest needed to:

- identify the private development package;
- declare ESM behavior;
- declare the Pi extension entry point;
- declare the Node engine floor;
- expose `typecheck`, `lint`, `test`, `build`, `smoke`, and aggregate `check` scripts;
- declare Pi core packages without bundling them as runtime copies; and
- produce a committed npm lockfile from a clean install.

Do not add runtime dependencies unless the entry point or verification contract genuinely requires them.

### 5.2 Minimal extension entry point

Add one source entry point that:

- exports the default Pi extension factory with the official `ExtensionAPI` type;
- can be loaded by Pi's jiti-based extension loader;
- registers no public commands, tools, shortcuts, flags, widgets, event behavior, persistence, or model interaction;
- starts no process, socket, watcher, timer, or background resource from the factory; and
- contains no placeholder Note to Self behavior.

An empty factory is intentional in this slice: it proves the runtime boundary without inventing user-facing behavior for later specifications.

### 5.3 TypeScript and lint configuration

Add strict TypeScript and local ESLint configuration sufficient to catch:

- incompatible or missing Pi imports;
- implicit or unsafe types, including prohibited explicit `any`;
- unused or unreachable foundation code;
- module-resolution and extension-entry mistakes; and
- repository code that violates the established TypeScript standards.

Do not add formatting churn or a general application framework.

### 5.4 Focused entry-point test

Add one focused Node test that verifies the foundation contract:

- the Pi package manifest names an existing extension entry point; and
- importing that entry point produces a callable default extension factory.

This is not a test of an empty function's behavior. It protects the real failure mode where a manifest or export drift makes Pi unable to load the extension.

### 5.5 Native Pi smoke check

Add a small smoke command that starts the installed Pi binary with:

- `--no-session`;
- `--no-extensions` so discovery is disabled; and
- `--extension`/`-e` pointing directly at this slice's entry point.

The smoke runner must use a non-interactive startup path that does not require a model request, credentials, or changes to global/project Pi settings. It must fail on process startup failure or extension-load failure and must clean up its child process. The exact RPC/startup readiness signal may be chosen during implementation from Pi `0.85.1`'s documented runtime behavior; it must be recorded in the implementation handoff.

### 5.6 Repository and CI gate

Keep `scripts/check_repository.py` and include it in the aggregate check. Update the repository's native CI command from the bootstrap-only check to a clean dependency install followed by the real project check, for example:

```text
npm ci --ignore-scripts && npm run check
```

The final command must run the typecheck, lint, focused test, package/build check, native Pi smoke check, and the existing repository check. The CI workflow must not silently skip the install or replace the aggregate check with a no-op.

## 6. Explicit Exclusions

This slice must not implement or decide:

- project identity, Git-root discovery, or local Note to Self storage (Feature Spec #2);
- human note creation, editing, or model-context policy (Feature Spec #3);
- `/nts`, `/note-to-self`, `/checkpoint`, widgets, expanded/compact views, or settings (Feature Specs #4–5);
- workstream/session/tree-leaf state or restoration (Feature Spec #6);
- deterministic activity classification or freshness behavior (Feature Spec #7);
- manual or automatic semantic checkpoints, model prompts, or update tools (Feature Specs #8–9);
- project shelf or cross-project navigation (Feature Spec #10);
- mouse interaction or advanced TUI components (Feature Spec #11);
- privacy/recovery hardening beyond the foundation's dependency and process cleanup obligations (Feature Spec #12);
- installation and upgrade UX (Feature Spec #13);
- release artifact, package publication, registry, versioning, or CD (Feature Specs #15–16); or
- a public command/tool added only to make the foundation look demonstrable.

## 7. Allowed Change Surface

Expected implementation files are limited to the minimum set needed for this contract:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- local ESLint configuration
- `src/index.ts`
- one focused entry-point test under `tests/`
- one native smoke runner under `scripts/`, if needed
- `.github/workflows/review-stack.yml` to install dependencies before `npm run check`

Do not modify Pi's global settings, `~/.pi/agent/extensions/`, project context outside this repository, or unrelated repository automation.

## 8. Verification Plan

Apply the test-quality gate: the outcome is a clean checkout with a truthful, loadable extension foundation. Each check below protects a named plausible failure.

| Check | Failure it must catch |
| --- | --- |
| `npm ci --ignore-scripts` | A dependency is undeclared, the lockfile is stale, or installation relies on an undeclared global package. |
| `npm run typecheck` | A Pi API import, module-resolution choice, or strict TypeScript contract is incompatible. |
| `npm run lint` | Unsafe/prohibited TypeScript, unused foundation code, or lint configuration drift is admitted. |
| `npm test` | The package manifest points at a missing entry or the entry no longer exports a callable default factory. |
| `npm run build` | Package assembly metadata is invalid or the project claims a build that does not actually validate its source/package boundary. |
| `npm run smoke` | The real Pi loader cannot start the extension even though direct TypeScript checks pass. |
| `python3 scripts/check_repository.py` | Tracked JSON is malformed, a relative Markdown link is broken, or tracked files contain trailing whitespace. |
| `npm run check` | The aggregate gate omits one of the required foundation checks. |

Rejected checks:

- No coverage threshold: it would measure test volume, not protect a foundation failure.
- No test for an empty factory's return value: it would only prove the test fixture mirrors the implementation.
- No UI or model tests: those behaviors are explicitly out of scope for this slice.

## 9. Acceptance Criteria

The draft is accepted for implementation only when Sarah approves it and the implementation can demonstrate:

- [ ] The future implementation branch and worktree named at the top are used; this documentation worktree is not reused for code.
- [ ] A clean `npm ci --ignore-scripts` succeeds without relying on global TypeScript or ESLint binaries.
- [ ] Pi `0.85.1` is the tested compatibility target and Node's declared floor is enforced by the manifest.
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run smoke`, and `npm run check` all execute real checks.
- [ ] The extension loads through Pi's `--no-session --no-extensions --extension` path without a model request or global configuration change.
- [ ] The package remains private and no public release or CD action occurs.
- [ ] GitHub's native review-stack gate runs the clean install plus aggregate project check.
- [ ] Existing OpenGrep, Gitleaks, Trivy, and repository checks remain enabled.
- [ ] The implementation commit and any review fixes are committed on the assigned feature branch, with a handoff listing checks, limitations, and unresolved decisions.

## 10. Handoff and Review

Before implementation begins, Sarah must approve this draft. During implementation:

1. Work only in the assigned linked worktree and branch.
2. Stop and report if the spec does not determine a consequential package, Pi API, security, or process-lifecycle choice.
3. Keep the primary checkout clean.
4. Run the focused checks and the repository review stack.
5. Request the bounded review required by the project workflow before integration.
6. Do not open, merge, or close a pull request automatically.
7. Do not integrate or delete the implementation worktree until Sarah authorizes the handoff.

## 11. Remaining Questions for Approval

The following are deliberately not guessed in this draft:

- The exact compatible release versions for TypeScript, ESLint, TypeScript ESLint, and Node types.
- The exact RPC/startup readiness signal used by the smoke runner.
- Whether future package publication will use npm, GitHub Releases, or another approved destination; Feature Spec #15 owns that decision.
