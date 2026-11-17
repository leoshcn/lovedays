# Frontend Quality Guidelines

- `pnpm typecheck` and `pnpm build` must pass (no separate linter configured yet).
- Mobile-first: modal is a bottom sheet on small screens; grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Icon-only buttons need `aria-label` (see FAB and color swatches).
- Inputs mirror server limits (title ≤ 50, note ≤ 500, interval 1–99) but server validation is authoritative.
