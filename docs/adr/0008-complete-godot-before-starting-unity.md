# Complete Godot before starting Unity

> Amended by [ADR-0011](./0011-narrow-to-a-single-godot-mvp.md): completing Godot *before* starting Unity becomes completing Godot *instead of* Unity. Unity is cut, so nothing later consumes a frozen Edition Contract.

Complete and package the entire Godot 4.7.2 Production Edition before beginning the deferred Unity 6.3 LTS reimplementation. This replaces the earlier parallel, lockstep plan: concentrating design, media, tuning, and engineering judgment in Godot first will produce one coherent finished experience sooner, while Unity can later consume the frozen Edition Contract and source media without influencing or slowing the Godot implementation.

## Consequences

- The active production sequence is Edition Contract, exact Godot toolchain, production-quality Godot tracer bullet, all seven Godot places, complete story and celebration, native macOS verification, and distributable packaging.
- No Unity editor installation, Unity worktree, Unity adapter, Unity tracer bullet, or cross-engine parity gate is active until the Godot Production Edition is complete and the project owner decides to begin the deferred Unity phase.
- The monorepo keeps `apps/unity/` reserved, and shared content, source media, identifiers, invariants, and parity scenarios remain engine-neutral so the future Unity implementation starts from an explicit contract rather than reverse-engineering Godot scenes.
- The Edition Contract initially has one production adapter and acts as Godot's acceptance surface. Its cross-engine comparison role becomes real when the deferred Unity adapter is added.
