# Feature Specifications

Feature Spec #1 is approved but implementation has not started; no implementation worktree exists yet.

## Proposed Feature-Spec Inventory

Entries without their own document are planning entries, not written specifications. Feature Spec #1 is approved but not implemented:

1. [Extension Foundation & Compatibility](01-extension-foundation-and-compatibility.md) — **Approved, implementation not started**
2. Project Identity & Local Storage
3. Human Note Lifecycle
4. Core Widget & Commands
5. Compact Fields & Display Preferences
6. Workstream Identity & Restoration
7. Deterministic Activity & Freshness
8. Manual Semantic Checkpoints
9. Automatic Semantic Checkpoints
10. Project Shelf & Workstream Navigation
11. Mouse & Advanced TUI Interaction
12. Privacy, Reliability & Recovery Hardening
13. Installation, Upgrade & Local Distribution
14. End-to-End Dogfood & Acceptance
15. Release Readiness & Publication Contract
16. Configure CD & Publish First Version

Feature Specs #15 and #16 are an approved planning split: #15 decides the release artifact and publication contract; #16 implements Continuous Delivery with an explicit human approval gate and verifies the first publication. Automatic deployment on every merge is not assumed.

Each implementation unit must have a bounded specification before code changes begin. The specification should identify:

- the exact behavior in scope;
- explicit exclusions;
- affected context and decisions;
- its dedicated Git worktree and feature branch;
- verification checks and their failure modes;
- handoff and commit requirements.

The complete product definition is in [project overview](../project-overview.md). Do not use it as permission to implement every feature at once. The [progress tracker](../progress-tracker.md) identifies the next unit, and the [planning decision ledger](../planning-decision-ledger.md) records approvals and open choices.
