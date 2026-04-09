# PixDone Design Foundations

## 1. Color System

### 1.1 Core Palettes

| Palette | Role | Dark (default) | Light |
|---------|------|----------------|-------|
| **background.default** | Page, app background | `#202124` | `#ffffff` |
| **background.elevated** | Cards, inputs, secondary surfaces | `#28292d` | `#f8f9fa` |
| **background.hover** | Hover state for list items, buttons | `#3c4043` | `#f1f3f4` |
| **text.primary** | Headings, body | `#e8eaed` | `#202124` |
| **text.secondary** | Supporting text | `#9aa0a6` | `#5f6368` |
| **text.muted** | Placeholders, disabled | `#70757a` | `#70757a` |
| **border.default** | Dividers, borders | `#3c4043` | `#dadce0` |
| **accent** | Primary actions, links, focus | `#1a73e8` | `#1a73e8` |
| **accent.hover** | Primary button hover | `#1557b0` | `#1557b0` |
| **shadow** | Pixel-style shadows | `rgba(0,0,0,0.3)` | `rgba(0,0,0,0.1)` |
| **semantic.success** | Completed, success | `#34a853` | `#34a853` |
| **semantic.danger** | Delete, errors | `#ea4335` | `#ea4335` |
| **semantic.warning** | Warnings | `#fbbc04` | `#fbbc04` |
| **overlay.backdrop** | Modal overlay | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.5)` |

### 1.2 Pixel Effect Colors (Celebration / Effects Only)

- **pixel.blue** `#0066ff`, **pixel.red** `#ff3333`, **pixel.green** `#33ff33`, **pixel.yellow** `#ffff33`, **pixel.purple** `#ff33ff`, **pixel.cyan** `#33ffff`, **pixel.white** `#ffffff`, **pixel.gray** `#808080`

### 1.3 Semantic Mapping & Usage

- **Primary actions**: accent (Save, Create, Sign up, Log in).
- **Destructive**: semantic.danger (Delete, Delete account, confirm buttons).
- **Success / completed**: semantic.success (checkmarks, completed state).
- **Smash List**: accent/purple gradient and semantic accents for emphasis; do not use for generic UI.
- **Tutorial / banners**: accent or info-style (e.g. primary tint) for CTAs.
- **Contrast**: All text-on-background and button combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text and UI).

### 1.4 Dark Mode

- Default is dark; light mode via `prefers-color-scheme: light`. Theme can be extended with a manual toggle (e.g. `data-theme="light" | "dark"`).

---

## 2. Typography

### 2.1 Typefaces & Roles

| Role | Font stack | Use |
|------|------------|-----|
| **Brand pixel (EN)** | `'VT323', 'Courier New', monospace` | Logo, EN pixel headings, Tutorial/Smash list header in JA |
| **Japanese pixel** | `'PixelMplus10', 'VT323', monospace` | JA list title, JA pixel headings, modal titles (JA) |
| **Body** | `'Inter', system-ui, sans-serif` | Descriptions, form labels, body copy, dropdowns |

### 2.2 Nine-Level Type Scale (Responsive)

| Level | Token | Size (rem) | Line height | Weight | Use |
|-------|--------|------------|-------------|--------|-----|
| 1 | **display.xl** | 3.5625 | 1.2 | 700 | Hero (rare) |
| 2 | **display.lg** | 2.8125 | 1.2 | 700 | Smash title |
| 3 | **display.sm** | 2.25 | 1.25 | 700 | — |
| 4 | **headline.lg** | 2 | 1.25 | 600 | — |
| 5 | **headline.md** | 1.75 | 1.3 | 600 | — |
| 6 | **headline.sm** | 1.5 | 1.3 | 600 | List title (EN scale up) |
| 7 | **title.lg** | 1.375 | 1.4 | 600 | Modal titles, sheet title |
| 8 | **title.md** | 1 | 1.4 | 600 | Section titles |
| 9 | **title.sm** | 0.875 | 1.4 | 500 | — |
| — | **body.lg** | 1 | 1.5 | 400 | Lead body |
| — | **body.md** | 0.875 | 1.5 | 400 | Body, inputs |
| — | **body.sm** | 0.75 | 1.45 | 400 | Captions |
| — | **label.lg** | 0.875 | 1.3 | 500 | Labels |
| — | **label.md** | 0.75 | 1.3 | 500 | Small labels |
| — | **label.sm** | 0.6875 | 1.3 | 500 | Overlines, tags |

Base 16px. On small viewports, display/headline levels can scale down (e.g. clamp); body never below 14px equivalent.

### 2.3 Accessibility

- Minimum body text contrast: WCAG AA.
- Focus indicators: 2px outline using accent; no outline-offset that breaks pixel aesthetic where needed.
- Avoid font-size below 0.875rem for body.

---

## 3. Layout & Grid

### 3.1 12-Column Grid

- **Breakpoints**: mobile `< 768px`, tablet `768px–1024px`, desktop `≥ 1024px`.
- **Container**: Max width optional (e.g. 1200px) for desktop; full width for task list and pager.
- **Columns**: 12; gutter 8px (mobile), 12px (tablet), 16px (desktop).
- **Margins**: 16px (mobile), 24px (tablet/desktop) for content insets.

### 3.2 Responsive Behavior

- **List tabs**: Horizontal scroll; fixed below header.
- **Pager**: One column; one list per page; swipe to switch.
- **Task list**: Single column; task cards full width of content area.
- **Modals**: Full-screen on mobile (auth) or bottom-sheet style; centered dialog on desktop (auth, confirm).
- **FAB**: Fixed bottom-right on mobile when list view is active.

---

## 4. Spacing & Radii

### 4.1 8px Spacing Scale

| Token | Value | Use |
|-------|-------|-----|
| **space.0** | 0 | Reset |
| **space.xs** | 4px | Icon padding, tight gaps |
| **space.sm** | 8px | Inline gaps, list item padding |
| **space.md** | 12px | Section spacing |
| **space.lg** | 16px | Block padding |
| **space.xl** | 20px | Card padding |
| **space.2xl** | 24px | Section margins, modal padding |
| **space.3xl** | 32px | Large sections |
| **space.4xl** | 40px | — |
| **space.5xl** | 48px | — |
| **space.6xl** | 64px | — |

### 4.2 Corners & Borders

- **Radius**: 0 (pixel-art default). Exceptions: optional 4px for tooltips or toasts if needed.
- **Border width**: 1px (default), 2px (emphasis, modals, focus).
- **Border style**: solid default; dashed for tutorial/hint outlines if used.

---

## 5. Motion

### 5.1 Duration

| Token | Value | Use |
|-------|-------|-----|
| **motion.duration.fast** | 0.15s | Toggle, hover |
| **motion.duration.medium** | 0.3s | Modal open/close, sheet slide |
| **motion.duration.slow** | 0.5s | Celebration, page transition |

### 5.2 Easing

| Token | Value | Use |
|-------|-------|-----|
| **motion.easing.linear** | linear | Progress, simple fades |
| **motion.easing.ease** | ease | Default |
| **motion.easing.easeOut** | ease-out | Enter, sheet slide up |
| **motion.easing.snappy** | cubic-bezier(0.2, 0.8, 0.2, 1) | Interactive feedback |

### 5.3 Reduced Motion

- Respect `prefers-reduced-motion: reduce`: disable decorative animations and shorten or remove transitions where appropriate.

---

## 6. Sound

### 6.1 Sound Tokens (Mapping to Implementation)

| Token | When | Notes |
|-------|------|--------|
| **sound.taskAdd** | Save new task, add list, create list | Positive feedback |
| **sound.taskEdit** | Open edit, save existing task, rename list | Confirmatory |
| **sound.taskDelete** | Confirm delete task/list/account | Destructive |
| **sound.taskCancel** | Close sheet, cancel form, cancel modal | Light |
| **sound.taskComplete** | Task marked complete (after effect) | Celebratory |
| **sound.buttonClick** | Buttons (date, chip, empty state, etc.) | Neutral click |
| **sound.subtaskComplete** | Subtask toggled to done | picoSound beep (optional pitch by count) |

### 6.2 Rules

- **Volume**: User-controllable; default on; mute via header dropdown.
- **Concurrency**: One UI sound at a time; debounce rapid clicks.
- **Accessibility**: Mute option always available; no critical information by sound only.
