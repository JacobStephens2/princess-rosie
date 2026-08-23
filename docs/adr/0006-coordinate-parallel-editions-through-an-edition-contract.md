---
status: superseded by ADR-0008
---

# Coordinate parallel editions through an Edition Contract

Reorganize the repository as a monorepo with the Original Edition, Godot Production Edition, and Unity Production Edition under `apps/`, and engine-neutral design, source media, fonts, tuning intent, and parity scenarios under `shared/`. A small, immutable Edition Contract is the authoring, build, and test seam: Godot and Unity each provide native adapters that prepare the same checksummed Edition Pack and prove observable journey behavior without sharing runtime code, scene graphs, rigs, UI, persistence, or build machinery.

## Consequences

- The Godot baseline is Godot 4.7.2 Standard with GDScript, Forward+, native animation and UI modules, audio buses, and macOS export; the Unity baseline is Unity 6.3 LTS with C#, URP 2D, Input System, 2D Animation, native animation modules, UI Toolkit, Localization, Test Framework, and macOS export.
- Stable domain identifiers, content, tuning intent, source media, fonts, behavioral invariants, and parity scenarios cross the seam. Engine physics constants, coordinates, scenes, imported assets, rigs, animation graphs, rendering, audio graphs, UI trees, persistence details, and build systems remain hidden in each adapter.
- One integration owner has exclusive write ownership of `shared/**`, `docs/**`, and root configuration. The Godot and Unity agents work in separate worktrees and edit only their application directories; shared ambiguities become contract-change requests rather than competing edits.
- Each Edition Pack revision is immutable and identified by a digest. Both adapters must prepare that revision and produce semantic evidence and Storybook Stage captures from the same parity scenario before their results are compared.
- Both agents first build the same end-to-end tracer bullet in parallel. After its contract is reconciled centrally, Godot leads production by one accepted place while Unity follows one frozen milestone behind; both pass the prior contract revision before shared design advances.
- The contract begins with a manifest-rooted pack and conceptual `prepare` and `prove` operations. It may gain typed capabilities only when a real new variation requires them; it will not become a shared runtime, general scripting language, or lowest-common-denominator game engine.
