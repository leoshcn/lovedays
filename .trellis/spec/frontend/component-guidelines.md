# Component Guidelines

- Pages are **server components**: they call `requireUser()` and services directly, then pass DTOs to client components. Mark pages `export const dynamic = "force-dynamic"` when they read user data.
- Client components (`"use client"`) handle interaction only and call server actions from `src/app/actions.ts`.
- Named exports, PascalCase components, kebab-case filenames.
- Styling: Tailwind utility classes inline. Color variants must come from `components/colors.ts` (static class strings so Tailwind can detect them) — never build class names like `` `bg-${color}-500` ``.
- Text is Chinese; status labels mirror `describe()` in `lib/days/engine.ts` (「距离 X 还有 N 天」/「X 已经 N 天」/「X 就是今天」).
- Destructive actions use `confirm()` before calling the action.
