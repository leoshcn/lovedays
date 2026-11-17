# Hook Guidelines

No custom hooks yet. Current patterns:
- `useTransition` + server action for mutations (`day-board.tsx`, `api-key-manager.tsx`); show `pending` by disabling buttons.
- `useState` for form fields; forms reset by remounting with a `key`.
- If a custom hook is added, name it `useXxx` and place it in `src/hooks/`.
