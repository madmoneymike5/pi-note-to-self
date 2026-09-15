# Note to Self

## Overview

Note to Self is a local Pi extension that helps Sarah resume work across several projects and several Pi chats. It keeps a human note, a compact view of current work, and a fuller project/session view inside Pi's existing terminal interface.

The human note is authoritative. The progress summary is generated assistance and must be clearly marked as such. The extension should make stale or missing summaries visible instead of presenting guesses as facts.

## Goals

1. Let Sarah leave herself a durable note that is easy to see when she returns.
2. Show what the current Pi session is doing, what it completed, what comes next, and whether anything is blocking progress.
3. Keep project-level context separate from individual session and branch context.
4. Update progress reliably from Pi lifecycle and tool events, rather than relying only on the agent remembering a special tool call.
5. Use Pi's existing commands, widgets, overlays, session state, and active model instead of creating a replacement client or hosted service.
6. Keep the display compact, readable, keyboard-accessible, and honest about its freshness.

## Core User Flow

1. Sarah starts Pi in a project for the first time.
2. Note to Self shows an expanded card so the feature is discoverable.
3. Sarah writes or edits her human note.
4. Sarah continues work normally. The extension records deterministic activity such as edits, tests, errors, branch changes, and idle boundaries.
5. When meaningful work finishes, Note to Self requests a structured semantic checkpoint if the current agent did not provide one.
6. The widget shows the compact one-line view. Clicking the widget toggles between compact and expanded views when Pi is receiving mouse input.
7. Sarah uses `/nts` or `/note-to-self` to open or toggle the view and `/checkpoint` when she wants an immediate update.
8. Later, `/nts` or the project shelf shows the human note and the most recent workstreams for the project.

## Features

### Human note

- One human-authored note per project.
- The agent never overwrites it.
- It remains visible in the expanded card and may be configured as model context separately from display.

### Project and workstream continuity

- Projects are identified by canonical Git root, with a safe cwd fallback when no Git root exists.
- Each Pi session and session-tree leaf has its own workstream state.
- The project view can show recent workstreams without merging unrelated chats.
- Raw transcripts and raw tool output are not stored as the product's summary data.

### Native Pi display

- A persistent widget sits in normal Pi layout space above the editor.
- The first run is expanded; the chosen compact or expanded state is remembered afterward.
- The compact view is one line and the expanded view contains the note and progress fields.
- The whole widget toggles compact/expanded state when mouse input is available.
- Keyboard and slash-command controls remain available in normal mode.

### Compact field choices

The one-line view has these available fields:

- latest completed item
- current task
- next step
- blocker
- human note

Sarah can enable or disable fields and arrange their order. At most four fields are shown at once. The default order begins with latest completed item, current task, and next step. An enabled blocker is never silently removed: it displays `Blocker: NONE` when there is no blocker.

### Reliable progress updates

- Deterministic events mark the summary as changed.
- A semantic checkpoint uses the active Pi model and a structured update tool.
- Automatic checkpoint attempts are limited and do not loop forever when an agent ignores one.
- `/checkpoint` provides a manual update path.
- The display shows whether the summary is fresh, pending, or stale.

### Release and distribution

- Local installation and upgrades are part of the product's later distribution work.
- Release readiness and the publication contract are planned as Feature Spec #15.
- Configuring Continuous Delivery and publishing the first version are planned as Feature Spec #16.
- The first CD workflow is expected to use an explicit human approval gate; automatic deployment on every merge is not assumed.

## Scope

### In Scope

- Local project notes and session/branch workstreams.
- Persistent compact and expanded native Pi widgets.
- `/nts`, `/note-to-self`, and `/checkpoint` command concepts.
- Reorderable compact-view fields with explicit `Blocker: NONE` state.
- Deterministic activity tracking and bounded semantic checkpoints.
- Keyboard fallback and mouse support where Pi's fullscreen TUI provides mouse events.
- Local persistence, schema versioning, atomic writes, and safe recovery behavior.
- Repository-local verification and the existing central review stack.

### Out Of Scope

- A replacement Pi client, desktop dashboard, web application, or always-on-top window.
- A hosted account, collaboration service, telemetry system, or mandatory external memory service.
- Storing raw conversations or tool logs as a second transcript database.
- A background daemon that launches an independent agent continuously.
- Automatically opening, merging, or closing pull requests.
- Continuous delivery or package publication before the release-readiness and publication-contract work in Feature Spec #15.
- Promising that an agent will always produce a correct semantic summary; the extension must expose stale or incomplete state.

## Success Criteria

1. A first-time user sees an understandable expanded card without reading project documentation.
2. A human note survives restarting Pi and is never replaced by an automatic summary.
3. Two sessions in the same project remain distinguishable instead of overwriting each other.
4. The compact widget can be changed to the expanded view without covering the transcript; it uses normal layout space.
5. In fullscreen mode, clicking anywhere on the widget toggles its size; in normal mode, keyboard and slash commands still work.
6. Successful edits, tests, errors, branch changes, and explicit checkpoints can mark the workstream as changed without agent cooperation.
7. Semantic summaries are requested at bounded checkpoints and are labeled stale when the update attempt is missing or incomplete.
8. An enabled blocker displays `Blocker: NONE` when clear.
9. Local checks and the GitHub review stack pass without credentials, telemetry, or a second client.
