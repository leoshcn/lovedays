# Hook Guidelines

Custom hooks: `useThemePref()` (`src/hooks/use-theme-pref.ts`) — `useSyncExternalStore` over `<html data-theme-pref>`, server snapshot `"system"` so hydration matches. Current patterns:
- `useTransition` + server action for mutations (`day-board.tsx`, `api-key-manager.tsx`); show `pending` by disabling buttons.
- `useState` for form fields; forms reset by remounting with a `key`.
- If a custom hook is added, name it `useXxx` and place it in `src/hooks/`.
