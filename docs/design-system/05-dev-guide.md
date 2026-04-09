# PixDone Design System – Developer Guide

## Overview

This guide explains how to work with the PixDone design system and React app: tokens, components, patterns, and conventions.

## Repository Layout

```
Bitdone/
├── app/                    # React app (Vite + TypeScript)
│   ├── src/
│   │   ├── design-system/  # Tokens, theme, primitives
│   │   ├── components/     # PixDone composites (TaskItem, ListTabs, etc.)
│   │   ├── features/       # useLists, useAuth, etc.
│   │   ├── services/       # Firebase, sound, API
│   │   └── types/          # Task, List, etc.
│   └── ...
├── design-tokens/          # pixdone.tokens.json
├── docs/design-system/     # Audit, foundations, components, migration
├── public/                 # Legacy HTML/JS app (until cutover)
└── ...
```

## Design Tokens

- **Source**: `design-tokens/pixdone.tokens.json`.
- **Usage in React**: `ThemeProvider` calls `getThemeCSSVariables(theme)` and sets `--pd-*` on `document.documentElement`. Use CSS: `var(--pd-color-background-default)`, `var(--pd-font-body)`, etc.
- **TypeScript**: `app/src/design-system/tokens.ts` mirrors the token structure and exports `tokens` and `getThemeCSSVariables`.

## Adding a New Component

1. **Primitive** (design-system): Add to `app/src/design-system/components/`, e.g. `Toggle.tsx`. Use `--pd-*` variables and existing spacing/typography. Export from `design-system/components/index.ts`.
2. **Composite** (app): Add to `app/src/components/`, e.g. `TaskSheet.tsx`. Use primitives and types from `src/types/`. Export from `components/index.ts`.
3. **Stories** (optional): After the component exists, add Storybook to the React app and add a story for the new component (all variants and states).

## Sound and Motion

- **Sound**: Every user action that changes state or opens/closes UI must trigger the appropriate sound via `services/sound.ts` (e.g. `playSound('buttonClick')`). Map interactions to: taskAdd, taskEdit, taskDelete, taskCancel, taskComplete, buttonClick, subtaskComplete.
- **Motion**: Use tokens for duration and easing (`--pd-motion-duration-medium`, `--pd-motion-easing-easeOut`). Respect `prefers-reduced-motion`.

## i18n and Fonts

- **Language**: Set `document.documentElement.lang` to `en` or `ja`; use a translation function for all user-facing strings.
- **Fonts**: List title and pixel headings in JA use PixelMplus10; Tutorial and Smash list headers in JA use VT323. Other UI uses Inter for body. Apply via `--pd-font-brand`, `--pd-font-brand-ja`, `--pd-font-body` and conditional class or `data-lang`.

## Do's and Don'ts

- **Do** use design tokens for all colors, spacing, and typography in new components.
- **Do** add sound feedback for every interactive control (buttons, chips, toggles, list actions).
- **Do** keep Tutorial, My Tasks, and Smash List as special cases (no list menu; Smash tab emoji-only; correct fonts for JA).
- **Don't** introduce new one-off colors or spacing values; add tokens if needed.
- **Don't** skip accessibility: focus order, aria labels, keyboard (Space for Smash, Enter for submit).

## Running the React App

```bash
cd app && npm install && npm run dev
```

Build:

```bash
cd app && npm run build
```

Output is in `app/dist/`. Configure your host to serve this at the desired path (e.g. `/` or `/app`).

## References

- [01-audit.md](01-audit.md) – UI and behavior inventory
- [02-foundations.md](02-foundations.md) – Color, typography, grid, spacing, motion, sound
- [03-components.md](03-components.md) – Component specs (30+)
- [04-migration-rollout.md](04-migration-rollout.md) – Migration and rollout plan
