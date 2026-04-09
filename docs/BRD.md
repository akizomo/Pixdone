# PixDone Business Requirements Document (BRD)

## 1. Product Overview

PixDone is a gamified to-do application designed to make task completion emotionally satisfying.

Most productivity tools focus on task management.
PixDone focuses on task completion.

Instead of organizing, prioritizing, and managing tasks, PixDone provides a playful and rewarding experience for finishing tasks.

The core interaction is:

**Write → Smash → Reward**

Users complete tasks and receive random pixel-style visual feedback, creating a feedback loop that encourages continued action.

The app also includes a built-in Pomodoro timer and supports theme customization. Premium themes are deeply personalized worlds — each with its own visual style, sound effects, completion effects, and a long-term progression system that grows alongside the user.

---

## 2. Problem Statement

Modern productivity tools have become increasingly complex.

Many tools require users to:
- organize tasks
- categorize tasks
- prioritize tasks
- manage projects

This creates friction before action.

In reality, many users simply want to: **Finish tasks and feel good about it.**

Paper to-do lists historically solved this problem because they provided physical feedback when tasks were completed.

Examples:
- crossing out tasks
- drawing lines through items
- crumpling paper

These actions provided immediate emotional reward. Digital tools rarely replicate this experience.

PixDone exists to restore that feedback loop.

---

## 3. Product Vision

PixDone aims to become the most emotionally satisfying way to finish tasks.

The product is not intended to replace professional task managers. Instead, it should become:
- a daily habit tool
- a playful productivity companion
- a stress-free task finisher
- a personal world that grows with the user

---

## 4. Target Users

**Primary target users:** Gamers who enjoy productivity tools.

Characteristics:
- enjoy playful UI
- appreciate small rewards
- dislike overly complex productivity systems
- prefer quick interactions

**Secondary audience:**
- people overwhelmed by traditional task managers
- people who like paper to-do lists
- casual productivity users

---

## 5. Core Product Principles

### 1. Immediate Feedback
Human behavior is reinforced by immediate feedback.

Every task completion must trigger:
- visual feedback
- optional sound feedback
- reward animation

Delay should be minimal.

### 2. Variable Rewards
Randomized rewards increase engagement.

Task completion may trigger:
- common effect
- rare effect
- epic effect

Common effects are shared across all themes. Their animation and shape are fixed, but color and font adapt to the active theme via CSS variables.

Rare and Epic effects are theme-specific originals. Each theme has its own unique Rare and Epic effects that express the full visual identity of that theme. These are available to PixDone+ subscribers only.

Examples:
- smash animation (Common)
- pixel burst (Rare — theme-specific)
- rainbow or freeze (Epic — theme-specific)

These effects create anticipation similar to game mechanics.

### 3. Minimal Friction
Adding or completing tasks should require minimal effort.

Interactions should be simple:
- tap
- swipe
- smash

Avoid complex input flows.

### 4. Emotional Satisfaction
The product should recreate the satisfaction of paper to-do lists.

Completion must feel:
- tactile
- playful
- rewarding

Visual feedback is essential.

### 5. Surprise and Delight
Occasional unexpected events improve memorability.

Examples:
- rare animations
- unexpected effects
- theme progression milestones

These should remain rare.

---

## 6. Core Features

### Smash List
The main task list system.

Concept: A list where tasks are not managed but smashed.

Users:
- add tasks
- smash tasks
- receive rewards

The list emphasizes completion rather than organization.
The Smash List is unlimited for all users.

### List
A standard task management list for organizing tasks across different areas of life.

Examples: Today, Work, Personal

- Free users can create up to 3 Lists.
- PixDone+ subscribers can create unlimited Lists.

Lists are navigated via swipe gestures.

### Repeat Tasks
Users can set tasks to repeat on a daily or weekly basis.
Repeat tasks are available to all users at no cost.

### Random Reward Effects
Task completion triggers randomized visual rewards.

| Tier   | Scope          | Description |
|--------|----------------|-------------|
| Common | All themes     | Basic smash. Color and font adapt to active theme via CSS variables. |
| Rare   | Theme-specific | Unique animation per theme. PixDone+ only. |
| Epic   | Theme-specific | Unique animation per theme. Intentionally rare. PixDone+ only. |

Effect selection on task completion:
- Free users: Common effects only.
- Plus users: Common effects + Rare and Epic effects belonging to the active theme.

Weighted probability (approximate):
- Common: 85%
- Rare: 12%
- Epic: 3%

### Theme System
The app supports multiple visual themes. Each theme defines:
- color palette
- pixel font
- background design
- sound effects
- Rare and Epic completion effects

Free users have access to the default theme only.
PixDone+ subscribers have access to all preset themes and AI-generated themes.

Themes adapt to time of day where applicable. Some themes support automatic Light/Dark switching based on the device clock, with manual override available.

### Theme Progression System
Each premium theme contains a long-term progression system tied to total task completions.

As users complete more tasks, the theme world gradually evolves. Progression is specific to each theme.

Examples by theme:
- **Forest Bit:** The forest grows from a single seedling into a deep, living woodland. Animals appear. Seasons change.
- **Ocean Pop:** Coral reef expands. New species of fish appear over time.
- **Cosmos Pop:** New planets form. Star nebulae spread across the background.

Progression data is retained even if the user cancels their subscription. The world stops growing but does not reset.

**This feature is planned for Phase 2** and will be introduced after the initial premium launch.

### Pomodoro Timer
A built-in Pomodoro timer is available to help users maintain focus during task sessions.

### Swipe Navigation
Lists are navigated horizontally using swipe gestures. Interaction should be smooth and intuitive.

### Pixel UI World
The app aesthetic is inspired by retro pixel games.

Visual characteristics:
- pixel typography
- simple UI
- retro game atmosphere

---

## 7. Technical Requirements

Current stack:

| Layer          | Technology |
|----------------|------------|
| Frontend       | Vanilla JavaScript, HTML, CSS |
| Backend        | Node.js, Express (TypeScript) |
| Database       | Firebase Firestore |
| Authentication | Firebase Auth |
| Payments       | Stripe (subscription billing) |
| Deployment     | Vercel |

PWA support via Service Worker.

---

## 8. Known Technical Challenges

### UI Consistency
Some components behave inconsistently.

Examples:
- bottom sheets
- dialogs
- swipe navigation
- keyboard handling

### State Management
Vanilla JS causes scattered UI logic. This makes components harder to maintain.

Possible future solution: React-based architecture.

### Effect and Theme Architecture
- Common effects must reference CSS variables for color and font. Hardcoded colors are not permitted inside effect logic.
- Rare and Epic effects are scoped to a specific theme and must be loaded conditionally based on the active theme.

---

## 9. UX Success Criteria

The product succeeds if users:
- complete tasks more frequently
- feel satisfaction after completing tasks
- continue using the app daily
- feel emotionally connected to their chosen theme world

Key emotional metrics:
- Does completing a task feel good?
- Does the user feel their world is growing with them?

---

## 10. Monetization Strategy

PixDone operates on a freemium model with a subscription plan called **PixDone+**.

### Free Tier
- Smash List: unlimited
- Common effects
- Lists: up to 3
- Repeat tasks
- Default theme only

### PixDone+ (Paid Subscription)
- Monthly: ¥600 JPY / month
- Annual: ¥6,000 JPY / year (equivalent to ¥500/month)

Includes:
- Lists: unlimited
- Rare and Epic effects (theme-specific)
- All preset themes (use any theme freely)
- Custom sound effects
- AI Theme Generation: 1 free generation per month (Phase 3 — future)

### AI Theme Generation (Single Purchase)
- ¥500 JPY per generation (Phase 3 — future)
- Generates a custom theme including color palette, effects, and sound effects from a user prompt.
- AI-generated themes are stored in the user's account and remain accessible even after subscription cancellation.
- Preset themes do not offer single purchases. Access requires an active PixDone+ subscription.

### Refund Policy
Refunds are available within 7 days of the initial purchase or renewal date by contacting support.

---

## 11. Future Opportunities

### Theme Progression System (Phase 2)
Each premium theme will include a long-term progression system. Task completions accumulate and cause the theme world to evolve visually over time.

Forest Bit will be the pilot theme for this feature.

### Collection System (Phase 3+)
When premium content reaches 10–20 or more items, a collection system will be introduced. This may include:
- limited seasonal themes and effects
- coin-based acquisition
- rare items tied to special events

The design of this system will be informed by actual user behavior after the initial launch.

### AI Theme Generation (Phase 3)
Users will be able to generate custom themes by entering a text prompt. The AI will produce a full theme including color palette, pixel-style effects, and sound effects.

PixDone+ subscribers receive 1 free generation per month. Additional generations are available as single purchases at ¥500 JPY each.

### Design System
Creation of a formal design system:
- design tokens
- component library
- Storybook documentation

### Improved Architecture
Possible migration to React or Next.js for better maintainability.

---

## 12. Product Boundaries

PixDone intentionally avoids becoming a traditional productivity suite.

The product should **not** include:
- complex project management
- heavy task categorization
- enterprise productivity workflows
- statistics or analytics dashboards
- calendar views or deadline management
- team or collaboration features
- native widgets (web app / PWA only)

The experience must remain: **simple, playful, fast.**

---

## 13. Product Tagline

> A to-do app to smash tasks and grow your own pixel world.
