# Feature Specification 02 — Project Identity & Local Storage

**Status:** Draft — awaiting approval
**Product:** Note to Self
**Proposed implementation branch:** `feature-02-project-identity-storage`
**Proposed implementation worktree:** `/home/sarah-taylor/Dev/worktrees/pi-note-to-self--f913adf4/feature-02-project-identity-storage`
**Authoring worktree:** `spec-02-storage`

This document defines the second implementation slice. It establishes stable project identity and the private local storage boundary needed by later Note to Self features. It does not implement user-facing note editing, workstreams, widgets, commands, activity tracking, or semantic checkpoints.

## 1. Purpose

Give Note to Self one deterministic, private local store for each project so separate Pi sessions and linked Git worktrees can find the same project data without using a display name, repository contents, a hosted service, or a second database.

This slice owns storage mechanics and record safety. Later specifications own the meaning and user experience of the records stored here.

## 2. Context and Dependencies

Read and apply:

- [Project overview](../project-overview.md)
- [Architecture context](../architecture-context.md)
- [UI context](../ui-context.md)
- [Code standards](../code-standards.md)
- [Development workflow](../ai-workflow-rules.md)
- [Progress tracker](../progress-tracker.md)
- [Current issues](../current-issues.md)
- [Planning ledger — Sections 2, 5, 6, 8, 9, 10, and 12](../planning-decision-ledger.md)
- [Feature Spec 01 — Extension Foundation & Compatibility](01-extension-foundation-and-compatibility.md)

Feature Spec 01 provides the private ESM TypeScript package, Node/Pi compatibility target, native Node APIs, and repository checks. This specification is documentation-only until Sarah approves it and explicitly starts implementation.

## 3. User/System Outcome

When this slice is implemented:

1. Two Pi sessions opened in the same project resolve the same project identity even when the display name is the same as another project, and linked worktrees share that project identity.
2. A non-Git directory still has a deterministic identity based on its canonical path.
3. Project state, the human note, and later workstream records have separate, private storage boundaries.
4. Valid version-1 records survive Pi restarts, while unsupported schema versions remain preserved and unavailable rather than being rewritten.
5. A failed or concurrent write cannot leave a partial record or silently replace a newer record without the storage layer reporting the failure.
6. Malformed or newer unsupported records remain recoverable and are never silently replaced with empty state.
7. No raw transcript, complete tool output, credential, provider token, or repository file is copied into the store.

## 4. Proposed Choices

These are the proposed choices for Sarah's approval:

- **Identity source:** when the cwd is inside a normal Git repository or linked worktree, resolve and canonicalize Git's common directory. Use that path as the shared project identity input; return the current worktree root transiently for later workstream logic, but do not persist it as shared project state in this slice. Outside Git, use the normalized real path of the cwd. Do not use a repository display name, remote URL, branch name, or network lookup as the primary identity.
- **Identity key:** hash the UTF-8 string `git-common:<canonical-common-directory>` for Git or `cwd:<canonical-cwd>` for non-Git fallback with SHA-256 and encode it as lowercase hexadecimal. The domain prefix prevents a Git path and cwd fallback from colliding; the canonical identity path remains in the project record for diagnostics but is not used as a filename.
- **Storage root:** use `$PI_CODING_AGENT_DIR/note-to-self/`, falling back to `~/.pi/agent/note-to-self/` when `PI_CODING_AGENT_DIR` is unset. Do not write Note to Self state into the repository.
- **Storage shape:** use native Node filesystem APIs and versioned JSON files. Do not add SQLite, a database server, or a new runtime dependency for this slice.
- **Project layout:** use one directory per project and no central index:

  ```text
  $PI_CODING_AGENT_DIR/note-to-self/
    projects/
      <project-key>/
        project.json
        note.md
        workstreams/
          <workstream-key>.json
        .lock
  ```

  The workstream directory and envelope are storage boundaries only; Feature Spec 06 defines workstream identity, fields, retention, and restoration behavior.
- **Write safety:** use a five-second bounded per-project exclusive lock plus temporary-file replacement. Multiple Pi sessions are an explicit product requirement, so omitting the lock would make same-record updates vulnerable to lost updates. A lock timeout fails closed; this slice does not automatically reclaim stale locks. No append-only journal, conflict-merge engine, or background compactor is introduced.
- **Recovery:** fail closed for malformed or newer unsupported records. Preserve the original bytes, report storage as unavailable/read-only for the affected project, and do not auto-create empty replacement state. Repair, reset, and stale-lock cleanup UX belong to Feature Spec 12.
- **Schema policy:** every JSON record has an integer `schemaVersion` and a `kind`. Version 1 is the only supported schema in this slice; newer or otherwise unsupported versions are read-only errors. No speculative migration framework is added before a real schema change exists. Unknown fields are retained during read-modify-write where safe.
- **Permissions:** create the store directory with private permissions where the platform supports them, and create record, note, temporary, and lock files with owner-only permissions. Do not weaken permissions merely to make a write succeed.

## 5. In Scope

### 5.1 Project identity resolution

Implement a small, synchronous-or-async-safe resolver with these rules:

1. Accept a cwd supplied by the Pi runtime; validate that it is an absolute directory after canonicalization.
2. Resolve the Git common directory and current worktree root with safe argument-array subprocess invocations (`shell: false`) or an equivalent trusted local mechanism. Canonicalize the common-directory path directly; do not assume it is the parent of `.git`, because separate Git directories are valid. Return the canonical `--show-toplevel` result only as transient current-worktree metadata. Do not use shell interpolation, repository remotes, or network calls.
3. If Git resolution fails because the cwd is not in a repository, canonicalize the cwd and use the `cwd:` identity domain. Unexpected canonicalization or permission failures are errors, not a reason to guess.
4. Hash the domain-separated canonical identity input to produce the project key. Derive a display name from the canonical identity path or cwd basename only; the display name is never an identity key.
5. Return enough identity data for storage and diagnostics: project key, canonical identity path, transient current worktree root when available, display name, identity source, and the domain-separated hash input.
6. A moved Git common directory or non-Git cwd produces a new identity; moving a linked worktree does not change project identity while its common directory remains the same. Do not silently merge records merely because names or remotes look similar.

### 5.2 Private store paths

Provide path derivation that accepts only validated keys and returns paths below the configured Note to Self store root. It must reject absolute keys, separators, `.` or `..` segments, symlink escapes, and unexpected key characters.

The implementation must not follow an existing symlink at the store root, project directory, or record path as a shortcut around containment or permissions checks. It must create only the directories it owns.

### 5.3 Versioned record contracts

Define the minimum storage envelopes without implementing later product behavior:

- `project.json` contains `schemaVersion: 1`, `kind: "project"`, `projectKey`, `canonicalIdentityPath`, `identitySource`, `displayName`, and created/updated timestamps. `currentWorktreeRoot` is not stored here; later workstream logic owns per-worktree metadata. Later project-level fields must not overwrite the identity fields or the human note.
- `note.md` is UTF-8 human-authored content stored separately from JSON-generated state. It has no generated front matter and is never written by generated progress updates.
- `workstreams/<workstream-key>.json` contains a versioned `kind: "workstream"` envelope, the owning project key, the workstream key, timestamps, and a later-spec payload. This slice validates the envelope and preserves the payload without inventing workstream semantics.
- JSON records must be bounded before parsing and writing: 64 KiB for `project.json` and 512 KiB for one workstream JSON record. The separate `note.md` has a 1 MiB storage safety ceiling. These are parser/storage ceilings, not the later user-facing note-length policy.
- Cross-record keys and kinds must agree. A record for another project must not be loaded into the current project merely because it is present in the directory.

### 5.4 Read, write, and schema boundary

Keep storage operations separate from Pi handlers and UI code. The boundary must support:

- resolve identity and derive contained paths;
- load a project record, note, or workstream envelope with explicit missing, valid, corrupt, and unsupported results;
- validate records before returning them to later features;
- accept version 1 records and return newer or otherwise unsupported versions as explicit read-only errors;
- write one validated record or note under the project lock; and
- report a failed write without claiming that state was saved.

Reads must not create empty project state as a side effect. A first successful explicit initialization may create the directory and minimal project record; later features decide when that initialization occurs.

### 5.5 Atomic and concurrent writes

For each mutation of a project directory:

1. Acquire the per-project lock with an exclusive create operation and a maximum five-second wait before reading any state that will be modified.
2. Do not automatically reclaim a stale or orphaned lock. If the lock remains unavailable after five seconds, leave the previous state unchanged and return a read-only/write-unavailable result. Repair and cleanup belong to Feature Spec 12.
3. For read-modify-write operations, reload and validate the current record while holding the lock, then validate the complete new content before opening the destination for replacement.
4. Write a same-directory temporary file with private permissions, flush it, and atomically rename it over the destination. Flush the directory where the platform supports it.
5. Release the lock in a `finally` path. A process that cannot release its lock must report the condition rather than pretending the write is complete.

A lock timeout is a write failure, not permission to overwrite. This first slice does not merge conflicting semantic edits; later work may add a more specific policy if real usage proves it necessary.

### 5.6 Corruption and unsupported-version behavior

The storage layer must distinguish:

- **Missing:** no record exists; later code may choose whether initialization is appropriate.
- **Corrupt:** bytes are not valid UTF-8/JSON, the envelope is invalid, keys do not match, or a value exceeds its bound. Preserve the original bytes and return an unavailable/read-only result for the affected record or project.
- **Unsupported:** the record is valid but its schema version is newer than this code understands. Preserve it and return an unavailable/read-only result.

No failure path may delete, truncate, overwrite, or silently replace the original record. No automatic empty-state reset or schema migration is part of this slice.

## 6. Explicit Exclusions

This slice must not implement or decide:

- human note editing, note commands, note-to-model context policy, or note history (Feature Spec 03);
- `/nts`, `/note-to-self`, `/checkpoint`, widgets, expanded/compact views, settings, or display preferences (Feature Specs 04–05);
- workstream/session/tree-leaf identity, restoration, retention, or summary fields beyond the storage envelope (Feature Spec 06);
- deterministic activity classification or freshness state (Feature Spec 07);
- manual or automatic semantic checkpoints, model prompts, or update tools (Feature Specs 08–09);
- project shelf or cross-project navigation (Feature Spec 10);
- mouse interaction or advanced TUI components (Feature Spec 11);
- the broader privacy, backup, repair, reset, or recovery UX beyond preserving data and failing closed (Feature Spec 12);
- installation and upgrade UX (Feature Spec 13);
- end-to-end dogfood acceptance (Feature Spec 14);
- release artifact, package publication, registry, versioning, or CD (Feature Specs 15–16); or
- Chronicle export, telemetry, raw transcript storage, credential storage, or a hosted database.

## 7. Allowed Change Surface

Expected implementation files are limited to the minimum needed for this contract:

- focused modules under `src/storage/` for identity, paths, validation, and file operations;
- the smallest necessary `src/index.ts` wiring, with no user-facing command or widget;
- focused offline tests under `tests/` for the named storage failure modes; and
- project documentation or repository-check updates only if the implementation exposes a real requirement.

Do not add a database dependency, modify Pi's global configuration, write into project repositories, add a public command, invoke a model, or create background watchers/timers for this slice.

## 8. Verification Plan

The test-quality gate outcome is the storage contract in Section 3. Each kept check protects one plausible failure mode:

| Check | Failure it must catch |
| --- | --- |
| Identity resolver test | Two roots with the same display name collide, linked worktrees fail to share a project key, separate Git directories are misidentified, or Git and non-Git resolution produce an unstable key. |
| Path-containment and permission test | A malformed key escapes the store root, follows a symlink, or creates records with public permissions. |
| Schema/validation test | Malformed JSON, wrong kind, mismatched project key, oversized content, or a newer schema is accepted as valid state. |
| Atomic-write failure test | A failed write truncates or replaces the previously valid record instead of preserving it. |
| Lock contention test | Two processes mutate the same project and one silently overwrites the other's complete record, or a lock timeout is reported as success. |
| Corruption recovery test | A malformed or unsupported record is deleted, overwritten, or silently replaced with empty state. |
| `npm run check` and repository gate | The new storage modules, focused tests, package type contracts, and tracked-document invariants are omitted or broken in aggregate. |

Rejected checks:

- No test for every getter, path string, or pass-through field; those would prove implementation shape rather than a real failure mode.
- No UI, mouse, lifecycle, or model-quality checks; those behaviors belong to later specifications.
- No coverage threshold; test volume does not prove safe persistence.

## 9. Acceptance Criteria

This draft is accepted for implementation only when Sarah approves it and the implementation can demonstrate:

- [ ] The implementation uses the assigned linked worktree and branch, not this documentation worktree.
- [ ] Git-common-directory and non-Git fallback identity resolution are deterministic, validated, and collision-resistant for distinct canonical identity paths; linked worktrees share one key.
- [ ] The project key is a lowercase SHA-256 hash of the domain-separated canonical identity input, and display names, branches, and worktree paths are not identity keys.
- [ ] Storage lives under the configured Pi agent directory in private per-project JSON files with a separate human note file.
- [ ] No new runtime database or hosted dependency is introduced.
- [ ] Version-1 record envelopes, explicit byte limits, cross-record validation, unsupported-version handling, and unknown-field preservation are documented in code and tested.
- [ ] Supported writes use bounded per-project locking and same-directory atomic replacement; failed writes preserve the last valid record.
- [ ] Malformed and newer unsupported records remain byte-for-byte recoverable and produce explicit unavailable/read-only results.
- [ ] The implementation does not add Note to Self commands, widgets, model calls, raw transcript storage, or project-repository writes.
- [ ] Focused offline checks and the aggregate repository check pass, with each check mapped to a real failure mode.
- [ ] The handoff records changed files, branch/worktree, checks run, checks not run, limitations, and remaining decisions.

## 10. Handoff and Review

This specification is documentation-only and awaits approval. When implementation begins:

1. Use `feature-02-project-identity-storage` in `/home/sarah-taylor/Dev/worktrees/pi-note-to-self--f913adf4/feature-02-project-identity-storage`.
2. Stop and report if implementation evidence requires a database, a different identity boundary, a different privacy boundary, or a different recovery policy.
3. Keep the primary checkout clean.
4. Apply the test-quality gate before adding or approving checks.
5. Run the focused offline checks, aggregate repository check, and required review stack.
6. Do not open, merge, or close a pull request automatically.
7. Do not integrate or remove the implementation worktree until Sarah authorizes the handoff.

## 11. Remaining Decisions

The following are deliberately left for later specifications:

- Human note editing, version history, and whether notes enter model context (Feature Spec 03).
- A future schema migration when a real version-2 record contract exists.
- Workstream fields, session/tree-leaf identity, and restoration behavior (Feature Spec 06).
- Exact activity events, freshness transitions, checkpoint budgets, and retry rules (Feature Specs 07 and 09).
- Repair, reset, backup, and broader storage hardening UX (Feature Spec 12).
- Installation, publication, release, registry, and CD (Feature Specs 13–16).
- Whether any curated checkpoint may later be exported to Chronicle.
