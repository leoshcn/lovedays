# Component Guidelines

- Pages are **server components**: they call `requireUser()` and services directly, then pass DTOs to client components. Mark pages `export const dynamic = "force-dynamic"` when they read user data.
- Client components (`"use client"`) handle interaction only and call server actions from `src/app/actions.ts`.
- Named exports, PascalCase components, kebab-case filenames.
- Styling: Tailwind utility classes inline. Color variants must come from `components/colors.ts` (static class strings so Tailwind can detect them) — never build class names like `` `bg-${color}-500` ``.
- Text is Chinese; status labels mirror `describe()` in `lib/days/engine.ts` (「距离 X 还有 N 天」/「X 已经 N 天」/「X 就是今天」).
- Destructive actions use `confirm()` before calling the action. Delete lives in the edit dialog footer (`DayForm` `onDelete`, edit mode only), not on home cards.
- Never combine conflicting width utilities (e.g. a shared `w-full` field class plus `w-20`): Tailwind v4 resolves by stylesheet order, not class order. Keep the shared field class width-less and add the width per use (see `FIELD` in `day-form.tsx`); inline rows of fixed controls use `shrink-0` + `whitespace-nowrap`.
