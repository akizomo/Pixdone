# PixDone Component Specifications (30+)

Each component lists: **anatomy**, **variants**, **states**, **behavior**, **accessibility**, **React API** (props/events).

---

## Core Primitives

### 1. Button

- **Anatomy**: Label (text or icon), optional icon before/after.
- **Variants**: primary, secondary, ghost, destructive, icon-only.
- **States**: default, hover, active, focus, disabled, loading.
- **Behavior**: Single click; no double-submit; optional loading spinner.
- **A11y**: Focus ring, aria-busy when loading, aria-disabled.
- **React API**: `variant`, `disabled`, `loading`, `onClick`, `children`, `ariaLabel` (icon-only), `type="button"|"submit"`.

### 2. IconButton

- **Anatomy**: Icon only (Fa or SVG), optional tooltip.
- **Variants**: square, circular; sizes: sm (32px), md (40px), lg (48px).
- **States**: default, hover, active, focus, disabled.
- **Behavior**: Click; tooltip on hover/focus (delay).
- **A11y**: aria-label required; tooltip as aria-describedby or title.
- **React API**: `icon`, `ariaLabel`, `onClick`, `size`, `disabled`.

### 3. FAB (Floating Action Button)

- **Anatomy**: Icon (plus), fixed position.
- **Variants**: Single primary action; mobile-only in current app.
- **States**: default, hover, active, focus; hidden when modal open.
- **Behavior**: Opens add-task flow (form or sheet).
- **A11y**: aria-label "Add task"; focus trap when modal opens.
- **React API**: `onClick`, `visible`, `ariaLabel`.

### 4. Chip / Pill

- **Anatomy**: Label text (e.g. "En", "Ja").
- **Variants**: Filter chip, language chip; selected vs unselected.
- **States**: default, selected, hover, focus.
- **Behavior**: Toggle selection; single-select in language group.
- **A11y**: role="button" or group with aria-pressed.
- **React API**: `selected`, `onClick`, `children`, `ariaPressed`.

### 5. Badge

- **Anatomy**: Numeric or dot.
- **Variants**: Count badge (list tab), dot (notification).
- **States**: N/A.
- **React API**: `count` (number or null for dot), `variant="count"|"dot"`.

### 6. Link / TextLink

- **Anatomy**: Inline text, optional underline on hover.
- **Variants**: Primary (accent), secondary (muted), danger.
- **States**: default, hover, focus, visited (optional).
- **React API**: `href` or `onClick`, `variant`, `children`.

---

## Inputs

### 7. TextField

- **Anatomy**: Label (optional), input, optional trailing icon (clear, password toggle).
- **Variants**: Single-line; with/without label; password with toggle.
- **States**: default, focus, filled, error, disabled.
- **Behavior**: Controlled; onClear when clear button clicked.
- **A11y**: label associated; aria-invalid, aria-describedby for error.
- **React API**: `value`, `onChange`, `placeholder`, `label`, `error`, `disabled`, `type`, `onClear`, `passwordToggle`.

### 8. TextArea / RichTextField

- **Anatomy**: Contenteditable or textarea; optional placeholder.
- **Variants**: Plain textarea vs rich (markdown hints in task details).
- **States**: default, focus, disabled.
- **React API**: `value`, `onChange`, `placeholder`, `disabled`, `minRows`.

### 9. Checkbox

- **Anatomy**: Box (custom styled), optional label.
- **Variants**: Task complete, subtask complete; pixel-art style.
- **States**: unchecked, checked, indeterminate (optional), focus, disabled.
- **A11y**: role="checkbox", aria-checked.
- **React API**: `checked`, `onChange`, `disabled`, `ariaLabel`.

### 10. Radio

- **Anatomy**: Circle, label. (Used in repeat modal etc.)
- **States**: unchecked, checked, focus, disabled.
- **React API**: `name`, `value`, `checked`, `onChange`, `children`.

### 11. Switch / Toggle

- **Anatomy**: Track, thumb (pixel-toggle).
- **Variants**: Sound on/off.
- **States**: on, off, focus, disabled.
- **A11y**: role="switch", aria-checked.
- **React API**: `checked`, `onChange`, `disabled`, `ariaLabel`.

### 12. Select / Dropdown

- **Anatomy**: Trigger (current value), list (options).
- **Variants**: Native select (repeat interval), custom dropdown.
- **States**: closed, open, focus, disabled.
- **React API**: `value`, `onChange`, `options`, `placeholder`, `disabled`.

### 13. DateInput / DatePicker

- **Anatomy**: Today / Tomorrow buttons, calendar button, hidden native input.
- **Variants**: Inline buttons + popover or native picker.
- **States**: default, open (picker).
- **React API**: `value`, `onChange`, `min`, `max`.

### 14. Slider

- **Anatomy**: Track, thumb. (For future settings.)
- **States**: default, focus, disabled.
- **React API**: `value`, `onChange`, `min`, `max`, `step`.

---

## Data Display & Layout

### 15. Card

- **Anatomy**: Container with optional header, body, footer.
- **Variants**: Default card (border, shadow).
- **React API**: `children`, `header`, `footer`.

### 16. ListRow / ListItem

- **Anatomy**: Label (list name), optional count badge; active indicator.
- **Variants**: List tab row (with count); Smash tab (emoji only, no count).
- **States**: default, active, hover.
- **React API**: `label`, `count`, `active`, `onClick`, `emojiOnly` (Smash).

### 17. TaskItem

- **Anatomy**: Checkbox, title (with markdown links), optional subtask preview, optional drag handle; optional edit/delete in context.
- **Variants**: Normal list (draggable, context menu); Smash list (no drag, no edit/delete, tap to complete).
- **States**: default, completed, dragging, focus.
- **Behavior**: Click row → edit; checkbox → complete; long-press (mobile) on Smash → complete.
- **A11y**: role="listitem"; checkbox aria-checked; keyboard (Enter to edit, Space to complete in Smash).
- **React API**: `task`, `onComplete`, `onEdit`, `onDelete`, `isSmash`, `dragHandle`.

### 18. SubtaskItem

- **Anatomy**: Checkbox, label, optional delete (in sheet).
- **States**: default, completed.
- **React API**: `subtask`, `onToggle`, `onDelete`, `readOnly`.

### 19. Tabs

- **Anatomy**: Tab list (horizontal), tab panels; list tabs = tab list only (panel is pager).
- **Variants**: List tabs (scrollable), underline active.
- **States**: tab default, active, hover.
- **React API**: `tabs[]`, `activeId`, `onChange`, `renderTab` (e.g. emoji for Smash).

### 20. Table (optional)

- **Anatomy**: Header row, body rows. For future dense data.
- **React API**: `columns`, `rows`, `onSort`.

---

## Overlays & Feedback

### 21. ModalDialog

- **Anatomy**: Overlay, content box (title, body, actions).
- **Variants**: Confirm (title + message + buttons), form (title + form + buttons).
- **States**: closed, open (animate in).
- **Behavior**: Close on overlay click or Escape; focus trap.
- **A11y**: role="dialog", aria-modal, aria-labelledby, focus trap.
- **React API**: `open`, `onClose`, `title`, `children`, `actions`, `ariaLabel`.

### 22. BottomSheet

- **Anatomy**: Overlay, sheet panel (slide up from bottom).
- **Variants**: Task sheet (multi-section), auth on mobile.
- **States**: closed, open (slide up).
- **Behavior**: Swipe down to close optional; keyboard avoidance.
- **A11y**: role="dialog", aria-modal; focus trap.
- **React API**: `open`, `onClose`, `children`, `title`.

### 23. Tooltip

- **Anatomy**: Trigger, popover with text.
- **States**: hidden, visible (on hover/focus with delay).
- **React API**: `content`, `children`, `placement`.

### 24. Toast / Snackbar

- **Anatomy**: Message, optional action; auto-dismiss.
- **Variants**: Success, error, info.
- **React API**: `message`, `variant`, `action`, `duration`, `onClose`.

### 25. Banner / InlineAlert

- **Anatomy**: Icon, message, optional action.
- **Variants**: Tutorial prompt, sync error, offline.
- **React API**: `variant`, `message`, `action`, `onDismiss`.

---

## PixDone-Specific

### 26. ListHeader

- **Anatomy**: Title (h2), optional list menu button (ellipsis).
- **Variants**: My Tasks / Tutorial / user list name / Smash list; font: JA → PixelMplus for user lists, VT323 for Tutorial/Smash.
- **States**: Menu visible only for user-created lists.
- **React API**: `title`, `showMenu`, `onMenuClick`.

### 27. SmashListPanel

- **Anatomy**: Subtitle text, optional hint (e.g. "Press Space to smash"), 3 SmashTaskTile components.
- **Behavior**: Always show 3 tasks; replenish on complete.
- **React API**: `subtitle`, `hint`, `tasks`, `onSmash`.

### 28. SmashTaskTile

- **Anatomy**: Same as TaskItem but no edit/delete; high-contrast card for smash.
- **States**: default, completed (then removed and replaced).
- **Behavior**: Click or Space to complete; long-press on mobile.
- **React API**: `task`, `onSmash`, `displayTitle`.

### 29. TutorialPanel / TutorialCTA

- **Anatomy**: Headline, subtext, Sign up button.
- **Behavior**: Shown when all tutorial tasks completed (unauthenticated).
- **React API**: `onSignUp`, `headline`, `subtext`, `buttonLabel`.

### 30. TaskSheet (Mobile)

- **Anatomy**: Header (title + close), sections: title input, details (contenteditable), date row (Today/Tomorrow/Calendar/Repeat), repeat selector, subtasks (list + add), footer (Cancel, Delete, Save).
- **States**: Empty states for details/subtasks; expanded/collapsed sections.
- **Behavior**: Open for add/edit; sound on each button; keyboard avoidance.
- **React API**: `open`, `onClose`, `task` (null = new), `onSave`, `onDelete`.

### 31. PagerViewport / PagerControls

- **Anatomy**: Track with N pages; one task list container per page; swipe to move.
- **Behavior**: One list per page; sync with list tabs; pointer/swipe for prev/next.
- **React API**: `currentIndex`, `pageCount`, `onIndexChange`, `children` (per page).

### 32. AuthPanel

- **Anatomy**: Header (close + title), form (email, password, submit), footer link (toggle Sign up / Log in), optional Forgot password.
- **Variants**: Sign up mode, Log in mode; Password reset modal; Password setup modal.
- **React API**: `mode`, `onSubmit`, `onClose`, `onToggleMode`, `onForgotPassword`.

### 33. UserDropdown

- **Anatomy**: Email, sound toggle, language chips, divider, support link, divider, Logout, Delete account.
- **React API**: `email`, `soundEnabled`, `onSoundChange`, `lang`, `onLangChange`, `onLogout`, `onDeleteAccount`, `open`, `onClose`.

### 34. ContextMenu

- **Anatomy**: List of actions (Rename, Delete); positioned at pointer.
- **Behavior**: Right-click or long-press; close on outside click or action.
- **React API**: `x`, `y`, `items[]`, `onClose`, `onSelect`.

### 35. CelebrationOverlay

- **Anatomy**: Full-screen overlay; message, subtitle; optional canvas effect.
- **Behavior**: Shown after task complete; auto-hide after delay; task effect runs on body clone.
- **React API**: `visible`, `message`, `subtitle`, `onDone`.

### 36. EmptyState

- **Anatomy**: Illustration (pixel character, zzz), message.
- **Variants**: Game start ("Ready?"), regular empty ("No tasks - Time to rest!"), loading (spinner + text).
- **React API**: `variant`, `message`, `subline`, `action` (optional).

### 37. CompletedSection

- **Anatomy**: Toggle button (chevron + "Completed (N)"), collapsible list of completed task cards.
- **States**: Collapsed, expanded.
- **React API**: `count`, `expanded`, `onToggle`, `children` (task list).

### 38. ErrorMessage

- **Anatomy**: Top banner with message; dismiss or auto-dismiss.
- **React API**: `message`, `onDismiss`, `visible`.
