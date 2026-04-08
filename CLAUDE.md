# Bitdone / PixDone — Claude Code Context

## Product Requirements

The full Business Requirements Document is at [`docs/BRD.md`](docs/BRD.md).

Read it before making decisions about features, monetization, UX, or architecture.

Key points to keep in mind:

- Core loop: **Write → Smash → Reward**
- Free tier: Smash List (unlimited), up to 3 Lists, Common effects, default theme only
- PixDone+: unlimited Lists, Rare/Epic effects, all preset themes — ¥600/month or ¥6,000/year
- Common effects use CSS variables for theming — **never hardcode colors inside effect logic**
- Rare/Epic effects are theme-specific and must be conditionally loaded
- Theme Progression System is **Phase 2** (not yet implemented)
- AI Theme Generation is **Phase 3** (not yet implemented)
- The product intentionally avoids: project management, analytics, calendars, team features

## Stack

| Layer          | Technology |
|----------------|------------|
| Frontend       | Vanilla JS / HTML / CSS (in `app/`) |
| Backend        | Node.js + Express (TypeScript) |
| Database       | Firebase Firestore |
| Auth           | Firebase Auth |
| Payments       | Stripe |
| Deployment     | Vercel |

## Project Structure

- `app/` — frontend (Vite, Vanilla JS)
- `app/src/design-system/themes/` — theme definitions
- `docs/` — documentation including BRD

## Sound Rules (mandatory)

Every interactive element **must** call `playSound(key)` from `services/sound.ts`. Use the sound token that matches the semantic action:

| Action | Sound key |
|--------|-----------|
| Add / create / Toggle ON (enable something) | `taskAdd` |
| Edit / open edit mode | `taskEdit` |
| Delete / remove / Toggle OFF (disable something) | `taskDelete` |
| Cancel / close modal / back button on detail pages | `taskCancel` |
| Success / confirm / set theme active | `taskComplete` |
| Select / tab switch / chip / list item / navigate | `buttonClick` |
| Subtask complete | `subtaskComplete` |

Rules:
- DS components (`Button`, `Chip`, `Toggle`, etc.) already call `playSound` internally — **do not call it again in the handler**.
- Raw `<button>` elements must call `playSound` in their `onClick`.
- The full mapping is documented in `app/src/design-system/foundations/sound.tokens.ts`.
