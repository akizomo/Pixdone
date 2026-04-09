# PixDone UI & Behavior Audit

## 1. UI Inventory

### 1.1 Screens & Key States

| Screen / Area | Key States | Notes |
|---------------|------------|--------|
| **App shell** | Header visible, list tabs, content area | Logo (Pixdone-white.svg), app title, user section or auth buttons, list tabs, add-list button |
| **List header** | Title (My Tasks / Tutorial / list name / Smash), list menu button | Menu hidden for Tutorial, My Tasks, Smash List. `#listTitle` has `data-fixed-english` for Tutorial/Smash (VT323 in JA). |
| **Task list** | Empty (game start / regular empty / loading / tutorial CTA), with tasks, completed section collapsed/expanded | `#taskList`, `#gameStartEmpty`, `#loadingFirestore`, `#emptyState`, `#tutorialCompleteCta`, `#completedSection` |
| **Desktop task form** | Hidden / visible | `#taskInputContainer`, `#taskForm`: title, details (contenteditable), date buttons (Today, Tomorrow, calendar, repeat), repeat selector, Cancel/Delete/Save |
| **Mobile task sheet** | Programmatic bottom sheet | Title, details, date row, subtasks, footer (Cancel, Delete, Save). Sections with empty states. |
| **Smash List view** | Message + 3 smashable tasks | Subtitle, hint (Space to smash), no count badge on tab; tab shows emoji only (💥). |
| **Modals** | Delete task, Create list, Edit list, Delete list, Context menu (rename/delete), Email auth, Password reset, Password setup, Delete account | Overlay + content. Auth modals: fullscreen on mobile, dialog on desktop (CSS). |
| **User dropdown** | Sound toggle, language chips (En/Ja), Support link, Logout, Delete account | `#userDropdown`, `#soundToggleBtn`, `#langEnBtn`, `#langJaBtn` |
| **Auth (guest)** | Auth buttons: language chips + Sign up | `#authButtons`, `#authLangEnBtn`, `#authLangJaBtn`, `#signupBtn` |
| **Celebration overlay** | Shown after task complete with effects | `#celebrationOverlay`, canvas + message. Body clone for effect; then overlay. |
| **Error message** | Top-of-screen error banner | `#errorMessage` |
| **Mobile FAB** | Shown on mobile when list view | `#mobileFab` |

### 1.2 EN vs JA

- **Typography**: JA uses PixelMplus10 for list title and pixel titles (except Tutorial/Smash list header → VT323). EN uses VT323 for pixel UI, Inter for body.
- **Copy**: All labels use `data-i18n` or `window.t()`; `messages.js` / i18n hold EN/JA strings.
- **Smash list**: Tab shows "💥" only. Header and list name stay "💥 Smash List" (or localized if ever added).

---

## 2. Component Inventory

### 2.1 Primitives

| Component | Variants | Where used |
|-----------|----------|------------|
| **Button** | Primary (save, create, auth submit), Secondary (cancel), Danger (delete, confirm delete), Ghost (auth link, forgot password), Icon-only (close, list menu, user avatar, add list) | Forms, modals, header, list actions |
| **IconButton** | Close (× or fa-times), Ellipsis-v (list menu), User (avatar), Plus (add list, add task, FAB), Calendar, Repeat | Header, list tabs, task form, sheet |
| **FAB** | Mobile only, plus icon | `#mobileFab` |
| **Chip / Pill** | Language (En, Ja), selected state | Auth bar, user dropdown |
| **Toggle** | Sound on/off | User dropdown `#soundToggleBtn` (pixel-toggle) |
| **TextField** | Single-line (task title, list name, email, password), with password toggle | Task form, list modals, auth forms |
| **TextArea / contenteditable** | Task details | `#taskDetails`, sheet details |
| **Checkbox** | Task complete, subtask complete | Task card, sheet subtasks (role="checkbox", custom styled) |
| **Date buttons** | Today, Tomorrow, Calendar, Repeat | Task form, sheet |
| **Select** | Repeat interval | `#repeatInterval` in form and repeat modal |
| **Link** | Support Pixdone, auth toggle (Log in / Sign up), Forgot password | Auth modal, dropdown |

### 2.2 Composites

| Component | Anatomy | States |
|-----------|----------|--------|
| **Task card** | Checkbox, title, optional subtasks preview, drag handle (desktop) | Default, completed, dragging. Smash list: no edit/delete, no drag. |
| **Subtask row** | Checkbox, label, delete (in sheet) | Default, completed |
| **List tab** | List name (or 💥), optional count badge | Default, active. Smash: no count. |
| **List header** | Title (h2), list menu button | Menu visible only for user-created lists |
| **Auth modal** | Header (close + title), form (email, password, submit, footer link, forgot password) | Sign up / Log in mode; forgot password section visibility |
| **Confirm modal** | Title, message, Cancel + primary/danger button | Delete task, delete list, delete account |
| **Create/Edit list modal** | Title, name input, Cancel + Create/Save | |
| **Context menu** | Rename, Delete | Positioned at pointer; list context |
| **User dropdown** | Email, sound toggle, language chips, divider, support link, divider, Logout, Delete account | Open/closed |
| **Completed section** | Chevron, "Completed (N)", list of completed task cards | Collapsed/expanded |
| **Empty state** | Illustration (pixel character, zzz), message | Game start, regular empty, loading |
| **Tutorial CTA** | Text, subtext, Sign up button | Shown when all tutorial tasks completed (unauthenticated) |
| **Smash list panel** | Subtitle, hint (desktop), 3 smash task cards | Always 3 tasks; replenish on complete |

### 2.3 Patterns

- **Task lifecycle**: Add (desktop form or mobile sheet) → Edit (click task or subtask row) → Complete (checkbox or Space on Smash) → Delete (context or sheet Delete). Tutorial: complete stays in list, no delete. Smash: complete removes and replenishes.
- **List lifecycle**: Create (modal), Rename (context → edit modal), Delete (context → confirm modal). Tutorial / My Tasks / Smash List: no menu.
- **Auth**: Sign up / Log in toggle; Forgot password → reset modal; Back to login. Password setup modal for first-time set.
- **Navigation**: List tabs (click or swipe in pager); keyboard not used for tab switch in current code.
- **Swipe**: Horizontal pager for list switching (pointer events); one page per list.

---

## 3. Behavioral Inventory

### 3.1 Sound (ComicEffectsManager / picoSound)

| Sound key | When |
|-----------|------|
| `taskAdd` | Save new task (desktop/sheet), add list, create list, add task button (intent), subtask add (sheet) |
| `taskEdit` | Open task edit (click task, subtask row, +N), save existing task, list rename |
| `taskDelete` | Confirm delete task, confirm delete list, delete account confirm |
| `taskCancel` | Close sheet, cancel form, cancel modals, cancel delete |
| `taskComplete` | Task completion (after effects or fallback) |
| `buttonClick` | Date buttons (Today, Tomorrow, calendar, repeat), empty state clicks, subtask add button, list tab interactions (e.g. lang chip), auth close, etc. |
| **picoSound** | Subtask complete beep (when subtask toggled to done) |

All interactive actions that change state or open/close UI use one of the above. Mute via user dropdown sound toggle.

### 3.2 Animations & Motion

- **Bottom sheet**: Slide up on open, slide down on close; keyboard avoidance (visualViewport).
- **Modals**: Overlay fade; auth modal on desktop is centered dialog (no slide).
- **Task complete**: Celebration overlay; task clone in body for effect (green highlight, text); pager transform re-applied after effect.
- **List switch**: Pager swipe (translateX); optional slide animation on task container (animateListSwitch).
- **Drag and drop**: Task reorder (desktop); `.dragging` class.

### 3.3 Keyboard

| Key | Context | Action |
|-----|---------|--------|
| **Space** | Smash List, focus not in input/modal | Smash first active task (with 300ms throttle) |
| **Enter** | Subtask input (sheet) | Add subtask |

No other global shortcuts documented in audit. Arrow keys may be used in modals (e.g. repeat modal).

### 3.4 Gestures

- **Pointer**: Swipe on content-below-tabs for list change (pager); long-press on Smash task for smash (mobile).
- **Click**: Task row → edit; task checkbox → complete; subtask checkbox → toggle; context menu actions.

### 3.5 Flows (Summary)

1. **Task create**: Add task → form/sheet → fill → Save → `taskAdd` → list update.
2. **Task edit**: Click task/subtask → sheet/form → edit → Save → `taskEdit` or Cancel → `taskCancel`.
3. **Task complete**: Checkbox or (Smash list) Space → effects → `taskComplete` → Smash replenish if applicable.
4. **Task delete**: Context menu Delete or sheet Delete → confirm modal → confirm → `taskDelete`.
5. **List create**: Add list button → modal → name → Create → `taskAdd`.
6. **List edit/delete**: List menu → Rename/Delete → modal → Save/Confirm → `taskEdit` / `taskDelete` / `taskCancel`.
7. **Auth**: Sign up / Log in → email + password → submit; Forgot password → reset flow; Password setup modal when required.
8. **Tutorial**: Default list for unauthenticated; complete all → show CTA → Sign up opens auth modal.

---

## 4. Files Referenced

- **Markup**: `public/index.html`
- **Styles**: `public/style.css`, `public/modal-override.css`, `public/idleRareEffect.css`
- **Logic**: `public/script.js` (main app, list/task UI, modals, pager, auth, sounds)
- **Effects**: `public/animations.js`, `public/perfectTimingEffects.js`, `public/perfectTiming.js`, `public/freeze-effect.js`, `public/idleRareEffect.js`
- **Sound**: ComicEffectsManager (in script or component-manager), `public/picoSound.js`
- **i18n**: `public/i18n.js`, `public/messages.js`
- **Firebase**: `public/firebase.js`
