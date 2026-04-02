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
