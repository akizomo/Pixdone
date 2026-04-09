# PixDone Design System

Publish-ready design system for PixDone: foundations, components, patterns, tokens, and implementation guide.

## Contents

| Document | Description |
|----------|-------------|
| [01-audit.md](01-audit.md) | UI and behavior inventory of the current app (screens, components, sounds, flows) |
| [02-foundations.md](02-foundations.md) | Color, typography (9 levels), grid, spacing (8px), motion, sound tokens |
| [03-components.md](03-components.md) | 30+ component specs: anatomy, variants, states, a11y, React API |
| [04-migration-rollout.md](04-migration-rollout.md) | Migration and rollout strategy from HTML/JS to React |
| [05-dev-guide.md](05-dev-guide.md) | Developer guide: tokens, adding components, sound, i18n, do's/don'ts |
| [06-principles-patterns.md](06-principles-patterns.md) | Brand principles, patterns, do's/don'ts, accessibility |

## Tokens and React

- **Tokens JSON**: [design-tokens/pixdone.tokens.json](../../design-tokens/pixdone.tokens.json) – single source of truth.
- **React theme**: `app/src/design-system/tokens.ts` and `ThemeProvider` – compile tokens to CSS variables (`--pd-*`).

## React App Structure

- **Design system** (`app/src/design-system/`): Theme, tokens, Button, IconButton, TextField, ModalDialog, BottomSheet, Chip.
- **Components** (`app/src/components/`): TaskItem, ListHeader, ListTabs, SmashListPanel, TutorialPanel.
- **Features** (`app/src/features/`): useLists (and future useAuth, useTasks).
- **Services** (`app/src/services/`): sound (and future Firebase, API).

Run the React app: `cd app && npm run dev`. Build: `npm run build`.

## Principles (Summary)

- **Playful Focus** – Pixel style without sacrificing clarity.
- **Tactile Feedback** – Sound and visual feedback on every action.
- **No-Surprise Flow** – Clear navigation and confirmations.
- **Pixel-Perfect Clarity** – Sharp edges, contrast, hierarchy.

All interactive UI must use design tokens and trigger the correct sound (taskAdd, taskEdit, taskDelete, taskCancel, taskComplete, buttonClick, subtaskComplete) per the [pixdone-sounds rule](../.cursor/rules/pixdone-sounds.mdc).
