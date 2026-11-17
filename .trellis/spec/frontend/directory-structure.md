# Frontend Directory Structure

```
src/app/page.tsx            # Home: server component, loads days, renders <DayBoard>
src/app/login|register/     # Server pages wrapping <AuthForm mode=...>
src/app/settings/page.tsx   # Account, API keys, REST/MCP usage snippets
src/app/globals.css         # Tailwind import + base styles
src/components/
  day-board.tsx             # Client: hero (first pinned) + card grid + FAB + form modal
  day-card.tsx              # Client: normal and hero card variants
  day-form.tsx              # Client: create/edit modal
  api-key-manager.tsx       # Client: create/revoke keys
  auth-form.tsx, sign-out-button.tsx
  colors.ts                 # DayColor → static Tailwind classes
```
