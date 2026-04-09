# PixDone Migration & Rollout Strategy

## Overview

Migrate from the current HTML/JS app (public/index.html + script.js) to the React app (app/) while preserving behavior, visuals, and URLs. The React app lives in `app/` and is built with Vite; the existing app remains in `public/` until cutover.

## Phase 1: Parallel Development (Current)

- **React app** (`app/`): Design system, primitives, and key PixDone components are implemented. State is local (useLists, placeholder useTasks).
- **Legacy app** (`public/`): Unchanged; remains the production entry until Phase 3.
- **Design tokens**: Single source in `design-tokens/pixdone.tokens.json`; React theme layer applies them via CSS variables.

**Deliverables**: Design system docs (01–03), tokens JSON, React app scaffold with ThemeProvider, Button, TextField, ModalDialog, BottomSheet, Chip, TaskItem, ListHeader, ListTabs, SmashListPanel, TutorialPanel.

## Phase 2: Feature Parity in React

1. **Data & auth**
   - Port Firebase init and auth (Firebase v8 compat) into `app/src/services/firebase.ts`.
   - Add `useAuth` and `useFirestoreLists` / `useFirestoreTasks` in `app/src/features/`.
   - Mirror logic: guest vs signed-in, Tutorial vs My Tasks, Smash List ephemeral tasks and replenishment.

2. **Task flows**
   - Implement full task CRUD in React (create, edit, complete, delete) with Firestore sync.
   - Port task completion effects: clone node, celebration overlay, sound (comicEffects + picoSound). Either call into legacy script or reimplement in React (e.g. canvas + CSS).
   - Implement desktop task form and mobile TaskSheet (bottom sheet) with date/repeat and subtasks.

3. **List flows**
   - List create/rename/delete with modals and context menu; disable menu for Tutorial, My Tasks, Smash List.

4. **Auth flows**
   - Email sign up / log in, forgot password, password reset, password setup, delete account. Use existing `/api/auth/*` and Firebase where applicable.

5. **i18n**
   - Port `messages.js` and `i18n.js` into React (e.g. context + hook). Set `lang` on document and use for font rules (VT323 vs PixelMplus for headers).

6. **Pager & swipe**
   - Implement horizontal pager (one list per page) with pointer/swipe and optional keyboard. Keep list tabs in sync.

7. **Sound**
   - Wire `app/src/services/sound.ts` to ComicEffectsManager (or reimplement in React). Ensure every interaction that currently plays a sound still does (taskAdd, taskEdit, taskDelete, taskCancel, taskComplete, buttonClick, subtaskComplete). Respect mute from user dropdown.

8. **Accessibility**
   - Focus trap in modals/sheets; Space for Smash list; aria labels and live regions where needed.

## Phase 3: Cutover Options

### Option A: Replace entry (recommended)

- Configure server (Vercel/hosting) so that the main entry (e.g. `/` or `/app`) serves the React build (e.g. `app/dist/`) instead of `public/index.html`.
- Legacy `public/` remains in repo for reference or fallback; no longer the default route.

### Option B: Gradual rollout

- Serve React app at a dedicated path (e.g. `/app` or `/v2`). Use feature flag or opt-in link to send users to React.
- After validation, switch default entry to React and redirect legacy path to React.

## Phase 4: Post-cutover

- Remove or archive legacy script/style bundles if no longer needed.
- Add E2E tests for critical flows (add task, complete task, Smash list, auth).
- Monitor errors and performance; fix regressions.

## Checklist (Summary)

- [ ] Firebase + auth in React
- [ ] Firestore lists/tasks read/write in React
- [ ] Task form (desktop) and TaskSheet (mobile) with full fields
- [ ] Task complete effects and celebration overlay
- [ ] Sound on all interactions; mute toggle
- [ ] List CRUD and context menu
- [ ] i18n (EN/JA) and font switching
- [ ] Pager + list tabs + swipe
- [ ] Smash list replenishment and Space key
- [ ] Tutorial CTA and auth modals
- [ ] Server/rewrites: serve React build at chosen path
- [ ] QA: compare legacy vs React for all main flows
