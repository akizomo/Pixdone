# PixDone React App

Vite + React + TypeScript app for PixDone. Uses the design system in `src/design-system/` (tokens, theme, primitives) and app components in `src/components/`.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output: `dist/`. Serve as the main app or under a path (e.g. `/app`) per [docs/design-system/04-migration-rollout.md](../docs/design-system/04-migration-rollout.md).

## Structure

- `src/design-system/` – Tokens, ThemeProvider, Button, IconButton, TextField, ModalDialog, BottomSheet, Chip
- `src/components/` – TaskItem, ListHeader, ListTabs, SmashListPanel, TutorialPanel
- `src/features/` – useLists (and future useAuth, useTasks)
- `src/services/` – sound (and future Firebase)
- `src/types/` – Task, List

Design system docs: [docs/design-system/](../docs/design-system/).
