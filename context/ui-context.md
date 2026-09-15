# UI Context

Note to Self uses Pi's native interface. It does not create a replacement workspace, dashboard, or chat window.

## Theme

Use the user's active Pi theme and native status conventions. Text must communicate state even without color.

| State | Presentation |
|---|---|
| Human note | Labeled `NOTE` and visually distinct from generated fields |
| Current work | `NOW` or `CURRENT`, with plain text |
| Completed work | `DONE` or a check mark plus the latest completed item |
| Next step | `NEXT` or an arrow plus the next step |
| No blocker | `Blocker: NONE` when the blocker field is enabled |
| Stale summary | Clear `STALE` or `UPDATE NEEDED` label |
| Checkpoint failure | Plain error and recovery path; never misleading success |

## Typography

Use terminal text and Pi's theme. Keep labels readable at common terminal widths. Do not rely on icons alone. Preserve exact project names, paths, commands, and user notes.

## Interaction Surfaces

### Persistent widget

- Use a widget above the editor, not a permanent overlay.
- First run shows the expanded card.
- Later sessions restore the user's compact or expanded choice.
- The compact form is one line when the terminal permits it.
- The expanded form uses normal layout rows and therefore pushes the transcript upward rather than covering it.
- The entire widget is one clickable target when Pi's fullscreen TUI supplies mouse events.
- Normal Pi mode retains slash-command and keyboard access because it may not capture mouse input.

### Commands

- `/nts` and `/note-to-self` open or toggle the Note to Self view.
- `/checkpoint` requests an immediate semantic checkpoint.
- A later settings command may edit field order, visibility, and model-context sharing.

### Compact field settings

Offer one reorderable list rather than a menu of every possible combination:

- latest completed item
- current task
- next step
- blocker
- human note

A user can enable or disable fields and move them up or down. At most four are shown in the one-line view. An enabled field remains present even when its content says none; `Blocker: NONE` is required. Empty space is not a reason to hide an enabled field.

### Expanded card

The expanded card should show:

- project name and status
- human note
- current workstream
- latest completed item
- current task
- next step
- blocker, including `NONE`
- freshness and whether the content is human-authored, deterministic, or generated
- keyboard hints for close, toggle, edit, and checkpoint

## Component Library

Use `ctx.ui.setWidget()` for the persistent card and native Pi TUI components for settings or project selection. Use custom components only where a compact/expanded toggle or mouse region requires them. Use the injected Pi theme and keybinding manager.

## Layout Patterns

- Keep the default compact view small.
- Wrap or shorten text safely; never let a rendered line exceed the available width.
- Use a full-width click target for the widget in fullscreen mode.
- Do not steal input from the editor when the widget is not focused.
- On narrow terminals, preserve field labels and state before decorative text.
- The expanded widget and the compact widget are two states of one surface, not separate persistent surfaces.

## Icons

Readable symbols such as `NOTE`, `NOW`, `DONE`, `NEXT`, and `BLOCKER` are preferred. Any icon is supplemental and must have a text label.
