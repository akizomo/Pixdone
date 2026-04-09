# PixDone Design Principles & Patterns

## Brand Principles

1. **Playful Focus** – The app feels light and game-like (pixel style, Smash list) but stays focused on getting tasks done. No clutter.
2. **Tactile Feedback** – Every action has clear feedback: sound (taskAdd, buttonClick, etc.) and visual state (hover, active, completion effect).
3. **No-Surprise Flow** – Predictable navigation (list tabs, pager), clear primary actions, and confirmations for destructive actions.
4. **Pixel-Perfect Clarity** – Pixel-art aesthetic with sharp edges (no border-radius on primary UI), high contrast text, and clear hierarchy.

## Patterns

### Navigation & list switching

- **Tab bar**: Horizontal list tabs (Smash first, then My Tasks/Tutorial, then user lists). Active tab underlined with accent. Smash tab shows emoji only (💥); others show name + count.
- **Pager**: One list per page; swipe or pointer drag to switch. Tabs and pager stay in sync.
- **Keyboard**: Space on Smash list smashes the first task; no tab switching by keyboard in current spec.

### Task lifecycle

- **Create**: "Add task" opens desktop form or mobile bottom sheet. Required: title. Optional: details, date, repeat, subtasks. Save → taskAdd sound, list updates.
- **Edit**: Click task row (or subtask row) → same form/sheet with data. Save → taskEdit; Cancel → taskCancel.
- **Complete**: Checkbox (or Space on Smash) → completion effect + taskComplete sound. Smash list: task removed and replaced.
- **Delete**: Context menu or sheet Delete → confirm modal → confirm → taskDelete.

### Auth & onboarding

- **Guest**: Default list is Tutorial. No persistence; completing all tutorial tasks shows CTA to sign up.
- **Signed in**: Default list is My Tasks; lists and tasks sync via Firestore.
- **Auth modal**: Sign up / Log in toggle; forgot password and password setup flows. Desktop: dialog; mobile: fullscreen or sheet per implementation.

### Error & offline

- **Sync errors**: Show banner or inline message; retry option.
- **Offline**: Indicate offline state (e.g. header indicator); queue writes and sync when back online.

## Do's and Don'ts

| Do | Don't |
|----|--------|
| Use design tokens for all color, space, type | Introduce one-off hex or px values |
| Add sound to every interactive control | Leave buttons/chips/toggles silent |
| Keep Tutorial / My Tasks / Smash as special (no list menu, correct fonts) | Allow rename/delete for system lists |
| Use VT323 for EN pixel UI and JA Tutorial/Smash header | Use PixelMplus for English-only headings |
| Use PixelMplus for JA list titles (user lists) | Use VT323 for user list titles in JA |
| Confirm before delete (task, list, account) | Skip confirmation for destructive actions |
| Respect prefers-reduced-motion and mute | Force motion or sound on users who opt out |

## Accessibility

- **Focus**: Visible focus ring (accent, 2px). Trap focus in modals and sheets; restore on close.
- **Labels**: Every icon button has aria-label; form fields have associated labels.
- **Live regions**: Use aria-live for dynamic messages (e.g. sync status) where appropriate.
- **Keyboard**: Enter to submit, Escape to close modals, Space for Smash (when focus not in input).
