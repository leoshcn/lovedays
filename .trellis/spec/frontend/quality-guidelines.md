# Frontend Quality Guidelines

- `pnpm typecheck` and `pnpm build` must pass (no separate linter configured yet).
- Mobile-first: modal is a bottom sheet on small screens; grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Icon-only buttons need `aria-label` (see FAB and color swatches).
- Inputs mirror server limits (title ≤ 50, note ≤ 500, interval 1–99) but server validation is authoritative.

- Check every UI change in **light and dark** (toggle in the header): no white surfaces left in dark, body text contrast ≥ 4.5:1, category cards distinguishable in both modes.
- **Focus**: every interactive element needs a visible `:focus-visible` ring. `globals.css` provides a base outline (`--ring`) for links/buttons/radios; inputs use `FIELD` (border + ring on focus). Do not add `outline-none` to buttons/links without a replacement; inside scroll containers add padding so rings are not clipped (see `CategoryFilter`).
- **Reduced motion**: respect `prefers-reduced-motion` — use `motion-safe:` for hover lift / press scale / slide animations; `globals.css` also strips transform transitions as a safety net.
- Icon-only buttons have both `aria-label` and `title` (card 置顶/编辑, FAB, theme toggle, dialog close).
