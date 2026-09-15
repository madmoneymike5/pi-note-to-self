# Architecture Context

This document describes Note to Self's whole-product architecture. The planning ledger records the decisions behind it. A feature specification must settle any consequential implementation choice before code depends on it.

## Stack

| Layer | Technology | Role |
|---|---|---|
| Runtime | TypeScript extension loaded by Pi | Commands, lifecycle hooks, tools, and state coordination |
| Terminal UI | Pi native widgets and TUI components | Compact/expanded card, settings, project list, and feedback |
| Session context | Pi `ExtensionContext` and `SessionManager` | Session ID, session file, current tree leaf, and lifecycle state |
| Storage | Local files under Pi's stable agent directory and project identity | Notes, preferences, workstream summaries, and schema-versioned state |
| AI | Pi's active model/provider | Bounded semantic checkpoint updates only |
| Delivery | GitHub Actions plus the central review stack | Native checks and blocking security checks |

No custom Pi client, hosted database, mandatory external service, or telemetry is required.

## System Boundaries

- **Pi integration:** Registers commands, widgets, tools, and lifecycle handlers. Pi remains responsible for permissions, model authentication, session replacement, and terminal rendering.
- **Project identity:** Resolves the nearest trusted Git root, falling back to a normalized cwd. It must not confuse two projects with the same display name.
- **Project record:** Owns the human note, project label, display preferences, and project-level status.
- **Workstream record:** Owns generated state for one session and current tree leaf. It records objective, current task, latest completed item, next step, blocker, decisions, freshness, and source.
- **Update engine:** Combines deterministic event facts with bounded semantic checkpoint requests. It does not invent completed work.
- **Presentation:** Renders the compact and expanded widget in normal Pi layout. The expanded widget is not a permanent overlay.
- **Persistence:** Writes only Note to Self data. It does not edit Pi credentials, identity instructions, context files, or arbitrary project files.
- **Delivery stack:** GitHub Actions is CI. OpenGrep, Gitleaks, Trivy, and weekly TruffleHog are security gates; Kodus and CodeRabbit are advisory; Greptile is manual-only. Continuous Delivery is deferred to Feature Spec #16 and depends on the release-readiness/publication contract in Feature Spec #15.

## Storage Model

The exact file names and schema are open until the first implementation specification. The settled shape is:

- A project record keyed by canonical project root.
- A separate human note that generated updates cannot overwrite.
- A workstream record keyed by Pi session ID and current tree leaf ID.
- A bounded history or checkpoint list so branches and resumed sessions remain distinguishable.
- Schema versioning and lossless handling of unknown fields where practical.
- Atomic replacement for writes and clear reporting when a write fails.
- No raw transcript or complete tool-output archive.
- Optional Pi custom entries for explicit checkpoint provenance; custom entries do not belong in LLM context.

The primary store is local. Chronicle may receive a later curated milestone only by explicit future design; it is not the noisy operational store for this extension.

## Auth and Collaboration Model

- Pi owns provider authentication. Note to Self does not create an account or copy credentials.
- Local notes may be sensitive. Files must use private permissions where supported, and model-context sharing must be explicit in the implementation design.
- The public GitHub repository contains source and project context, not Sarah's local notes or workstream data.
- Existing Pi permissions and user confirmation rules remain authoritative.

## AI Generation Model

### Deterministic activity

Pi lifecycle and tool events can record facts without a model: session start/stop, user activity, successful file mutation, test/build execution, tool errors, branch changes, and last activity time. These facts mark a workstream as changed and provide useful fallback evidence.

### Semantic checkpoint

When a meaningful change reaches an idle boundary, the extension may send one bounded hidden follow-up to the active agent asking it to call a structured Note to Self update tool and stop. The update tool accepts generated fields only and stores the evidence source. A missing response marks the summary stale; it must not trigger an endless loop.

The exact event classification, cooldown, retry behavior, and model-call budget belong in the first feature specification. A separate background summarizer is not required for the initial design.

## Invariants

1. Human notes are never overwritten by generated summaries.
2. Workstreams from separate sessions or branches are never silently merged.
3. `Blocker: NONE` is valid, useful state when the blocker field is enabled.
4. Deterministic facts are not presented as semantic conclusions.
5. A semantic summary that was not successfully refreshed is labeled stale or pending.
6. The widget uses normal layout space; persistent Note to Self UI does not cover the transcript.
7. Mouse interaction is progressive enhancement. Keyboard and slash commands work without mouse capture.
8. Automatic checkpoints are bounded and cannot recursively trigger themselves forever.
9. Notes, summaries, and project paths are validated at trust boundaries; secrets are not copied or sent to Chronicle.
10. Existing Pi permissions, identity instructions, provider rules, and other harness restrictions remain in force.
11. GitHub Actions and security gates use immutable reviewed revisions; review bots do not silently gain write authority.

## Open Architectural Decisions

Before implementation, settle:

- Exact stable storage path, file layout, schemas, migrations, and multi-process write behavior.
- Exact event list and cooldown for automatic checkpoint requests.
- Whether the human note is model context by default or display-only by default.
- Exact compact-field editor behavior and the maximum field length/truncation rules.
- First feature slice and its accepted verification evidence.
- Package name, license, release artifact, registry, and publication contract; Feature Spec #15 owns these decisions, while Feature Spec #16 owns the CD workflow and first publication.
- Whether any curated checkpoint should be exported to Chronicle and under what approval boundary.
