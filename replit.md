# PixDone - Task Management App

## Overview
PixDone is an emotionally-rewarding task management application that combines Google Tasks-level functionality with unique celebration animations and encouraging messages. It is a full-stack web application supporting user accounts, Google authentication, and persistent data storage. Its business vision is to provide a unique, engaging task management solution that stands out in the market by focusing on user satisfaction and emotional reward, enhancing productivity through positive reinforcement.

## User Preferences
Preferred communication style: Simple, everyday language.
Design style: Google Tasks-inspired clean, minimal interface with comic-style completion effects.
Effect requirements: Short (1-2 seconds), task-anchored animations that don't block interaction.
UX improvements: Form should close on outside click, Enter key should play sound, Cancel should have sound feedback.
Mobile optimization: Enhanced mobile usability with larger touch targets, better input handling, and keyboard-aware modal forms with background-close functionality.
UI layout: Empty state displayed before completed tasks section, with "zzz..." speech bubble illustration. Simple 8-bit style speech bubble with pixel-style border to indicate sleep/rest state.
Design consistency: All UI elements should follow pixel/8-bit design aesthetic with 0px border-radius, 2px borders, box-shadows, and pixelated rendering.
Auth modal design: User prefers clean, modern authentication modal with mobile-first design, password visibility toggle, and integrated social login buttons following the pixel aesthetic.
Auth flow: User wants single "Sign up" button on home page, with signup as primary action in modal. Existing users can switch to login within modal.
Authentication method: Firebase Authentication with email verification - users must verify their email before account activation.
Multiple lists: User requested ability to create and manage multiple task lists beyond the default "My Tasks".
List navigation: User prefers tab-based navigation over dropdown to reduce unnecessary clicks and improve workflow efficiency.
Tab design: User prefers simple, understated tab design with minimal visual prominence, especially for active tabs.
Navigation controls: User requested swipe gestures on mobile for list switching and arrow keys on desktop for enhanced navigation efficiency.
Animation preference: User wants only the task list content to slide and animate during list switching, not the entire interface.
Tab scrolling: User prefers horizontal scrolling tabs when there are many lists instead of wrapping to multiple rows.
Context menu: User prefers right-click context menu for list management instead of visible edit/delete buttons on tabs.
List header: User requested a header section between tabs and tasks displaying the current list title with a menu button for actions.
Font preference: User prefers Orbitron font for pixel-style headings as VT323 doesn't work well with Japanese text.
Design preference: User prefers minimal design for list header and menu buttons without background colors or borders.
Firebase configuration: User completed Firebase project setup with project ID "red-girder-465715-n" and enabled email/password authentication.
Menu button visibility: Default "My Tasks" list should not display menu button for rename/delete operations.
Sound feedback: All user interactions should have audio feedback by default - menu clicks, button presses, form submissions, modal actions all include appropriate sound effects.
List menu sound: Fixed list menu button sound feedback - now plays 'taskEdit' sound when clicked on non-default lists.
Mobile drag and drop: Implemented mobile task reordering with touch events and visual feedback.
Completed task count: Fixed completed task counter to show only current list's completed tasks instead of all lists.
Game start empty state: Implemented 8bit retro-style "Ready?" empty state for completely empty task lists - displays cyan pixel font "Ready?" with blinking animation and simple instruction text when no tasks exist at all.
Modal behavior refinements: Modal should only close on cancel button (not background click or X button), removed header and X button, fixed task editing logic to properly update existing tasks instead of creating duplicates.
Mobile modal enhancement: Added comprehensive mobile-optimized modal with delete button for editing, date selection (today/tomorrow/calendar), repeat options, UI consistency with app design system, mobile-friendly dimensions with 2-row textarea, and keyboard-aware layout with fixed bottom buttons.
Smash List enhancement: Added 💥 emoji to title for clear visual identification as stress relief/fun feature, properly hidden add task button, and displayed explanatory message "This list exists only to let you tap and smash tasks for pure satisfaction. No saving, no planning—just smashing." when list is empty.
Smash List tab count fix: Removed task count display from Smash List tab to maintain clean interface for stress relief feature.
My Tasks duplication fix: Fixed duplicate My Tasks list creation bug during Firebase authentication login by implementing creation flag and duplicate cleanup in migration function.
Authentication flow improvement: Modified login flow to prevent duplicate list creation by clearing local storage before Firebase listeners and adding proper Smash List creation with initial tasks in Firebase.
Smash List detection fix: Fixed Smash List detection logic to work with both local ('smash-list') and Firebase IDs by checking list name ('💥 Smash List'), ensuring add button is hidden and explanatory message displays correctly after login.
Smash List infinite gameplay enhancement: Implemented infinite gameplay mechanics where tasks are immediately removed after completion and automatically replenished to maintain exactly 3 tasks at all times - explanatory message now displays even when tasks are present, no data persistence (refresh resets), and identical behavior in logged/unlogged states for pure stress relief experience.
Smash List task editing prevention: Added protection to prevent Smash List tasks from being edited by checking list ID and name in editTask function.
Mobile modal button layout fix: Added missing CSS for mobile-modal-buttons class including proper positioning, styling, and 8-bit retro design consistency for bottom fixed buttons in mobile task add/edit modal.
Task add modal delete button fix: Fixed delete button showing in task add modal by ensuring it's properly hidden when adding new tasks (currentTask is null) and only visible when editing existing tasks.
Bottom sheet modal: Converted full-screen mobile modal to proper bottom sheet modal that slides up from bottom with handle bar, rounded corners, and proper mobile UX - matches native mobile app behavior with slide-up animation and drag-to-close functionality.
Full-screen modal redesign: Reverted to full-screen modal without rounded corners and drag handle per user feedback, with completely redesigned bottom button layout using proper inline styles to ensure consistent appearance across all mobile browsers.
Smash List completion effects: Added completion effects (scaling, color changes) to Smash List tasks matching regular task completion effects - delayed task removal and replenishment until after visual effects complete to ensure users see the satisfying feedback when completing dummy tasks.
Duplicate effects prevention: Fixed overlapping effects issue by preventing duplicate completion calls with processing flag and touch/click event deduplication - ensures each task completion only triggers effects once even on mobile devices where both touch and click events might fire.
Celebration effects fix: Eliminated duplicate showCelebration calls by moving celebration trigger to single location before animation branching - prevents overlapping comic effects, sounds, and visual feedback that were caused by calling showCelebration in both animation and fallback branches.
Final overlap prevention: Added celebration flag protection to prevent duplicate celebration for same task, improved event listener setup to only run once per app initialization, and added comprehensive duplicate prevention at multiple levels to ensure completely clean effects.
Authentication email spam notice: Added notice to verification email dialog advising users to check spam folder if email not received - changed all authentication messages to English and included spam folder guidance for better user experience.
Long press drag implementation: Fixed overly sensitive drag and drop that interfered with scrolling by implementing 300ms long press detection - drag mode only activates after holding task for 300ms without moving more than 8px, includes visual feedback with opacity, scale, and shadow effects for better mobile experience.
Mobile date button toggle: Added toggle functionality to Today/Tomorrow buttons in mobile task modal - pressing an already selected date button now deselects it, allowing users to easily remove date assignments with improved UX feedback.
Rainbow Smash super rare effect: Implemented 8bit retro "Rainbow Smash" task completion effect with 3% probability - features healing rainbow arc animation, gentle sparkle particles, soft background glow, "Rainbow" text with gradient animation, and soothing chiptune melody using triangle/sine waves. Designed for "ふぅ…やりきった" (peaceful accomplishment) feeling rather than excitement.
Animation variety enhancement: Added 8 new animation effects (bounce, slideLeft, slideRight, flip, shrink, stretch, wobble, fadeOut) to reduce repetitive right rotation patterns and provide more diverse completion animations - now includes 16 total effects with balanced variety in movement directions and animation types.
Animation text effects completion: Fixed text overlapping issue by adding clearExistingEffectText() method and effect-text class to all text elements, added comprehensive text effects to all 8 new animations (BOUNCE!, SLIDE!, FLIP!, SHRINK!, STRETCH!, WOBBLE!, FADE!) with unique colors, appropriate motion, and proper cleanup - eliminated missing text effects and overlapping text problems.
UI styling unification: Implemented consistent 8-bit pixel aesthetic throughout mobile modal with proper border-radius: 0px, 2px borders, box-shadows, and image-rendering: pixelated - unified typography, spacing, and visual hierarchy to match app design system.
Modal-based date/repeat selection: Implemented proper modal interfaces for calendar date selection and repeat frequency selection with dedicated confirm/cancel buttons, improved UX with clear visual feedback and proper 8-bit styling consistency.
UI styling consistency: Fixed mobile modal styling to properly use CSS variables for light/dark mode support, corrected border thickness (2px) and corner radius (0px) to match desktop form behavior, unified button styling with proper active states using accent colors.
Modal-based selection UX: Implemented OS native date picker for calendar selection and compact centered modal for repeat frequency selection, replacing full-screen modals with more appropriate UX patterns - native date picker provides familiar OS experience while repeat modal uses compact centered design similar to list creation modal.
Standard UX enhancements: Fixed native date picker to properly trigger OS date selector with showPicker() method, added background-click-to-close functionality for repeat modal, and implemented visual feedback showing selected repeat frequency on button text for better user experience.
Modal focus enhancement: Task add/edit modal now automatically focuses and selects the title field on open, providing immediate keyboard-ready state for efficient task entry and editing.
Save button validation: Implemented title validation that disables Save button when title is empty, with real-time validation on input changes and proper visual feedback through opacity and color changes.
Date display enhancement: Date selection buttons now display the selected date (Today, Tomorrow, or MM/DD format for custom dates) with proper visual feedback and sound effects, improving user experience by showing what date is currently selected.
Audio feedback protection: Added comprehensive null checks for all audio feedback calls to prevent JavaScript errors when comicEffects is not initialized, ensuring stable operation across all user interactions.
Icon standardization: Replaced emoji icons with Material Design icons using Font Awesome for calendar button while removing unnecessary icons from today/tomorrow buttons for cleaner interface.
PWA support: Added Progressive Web App support with manifest.json, service worker, and mobile-specific CSS for standalone mode - includes proper icon configuration using PixDone.png, safe area handling for notched devices, and offline caching capabilities for improved mobile experience.
Mobile keyboard handling: Implemented enhanced mobile keyboard detection and button positioning using viewport height monitoring, Visual Viewport API support, and hardware acceleration for smooth PWA operation - ensures bottom buttons remain visible above keyboard in both browser and PWA modes.
UI language standardization: Converted all app interface text to English and standardized shadow styling to 8-bit retro game aesthetic with pixelated box-shadow effects using 3px 3px 0px for consistent visual design.
Offline task management: Implemented comprehensive offline task management functionality that allows users to create, edit, and delete tasks even when not logged in - tasks are stored locally and synced with Firebase when users log in, with proper default list initialization and seamless switching between authenticated and unauthenticated states.
Tutorial task system: Added default tutorial tasks for unauthenticated users with 4 English instructional tasks displayed in "My Tasks" list - tasks guide users through completion effects, Smash List discovery, and authentication benefits. Tutorial tasks are excluded from Firebase migration and automatically cleared upon login.
Authentication UI improvements: Converted all authentication dialog text to English, fixed tutorial task persistence after login, and resolved Smash List duplication by ensuring authenticated users receive Smash List from Firebase while unauthenticated users get local version.
Tutorial task completion behavior: Changed tutorial tasks to be deleted after completion rather than marked as completed, providing cleaner progression through the tutorial flow - tasks with IDs starting with 'tutorial-' are automatically removed from the list after completion effects finish.
URL handling functionality: Implemented comprehensive URL processing for task text including automatic link conversion (plain URLs to clickable links), hyperlink creation (selected text + pasted URL becomes markdown-style link), and markdown link parsing - all links open in new tabs with security attributes, supports both task titles and details with 8-bit retro styling. Added real-time link preview in edit fields and changed link color to Google Blue (#1A73E8).
Desktop inline editing: Implemented desktop inline task editing where clicking a task expands it into an editable form instead of opening a modal - includes title/details editing, save/cancel/delete buttons, and real-time link preview. Mobile devices continue to use full-screen modal for optimal touch experience.
Legacy URL redirect: Implemented automatic 301 redirect from old domain (pixtask.replit.app) to new domain (PixDone.replit.app) - server middleware detects old domain access and redirects all paths to maintain SEO and user experience continuity.
Smash List text refinement: Changed explanatory message from "This list exists only to let you tap and smash..." to "This app exists only to let you tap and smash..." to better reflect the app's simplified focus on the smashing experience.
Desktop keyboard shortcut: Implemented Shift key shortcut for desktop users to smash tasks in the Smash List - pressing Shift completes the first task with full effects and animations. Feature is desktop-only (detected via matchMedia with hover:hover and pointer:fine), includes 300ms debounce to prevent rapid triggers, and is disabled when focus is in input fields or modals. Desktop-only hint text "Press Shift to smash a task" displays below the main message using CSS media query to hide on mobile/touch devices.

## System Architecture

### Frontend Architecture
- **Client-Side Interface**: Vanilla HTML5, CSS3, and JavaScript, utilizing a Single-Page Application (SPA) model.
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox.
- **Canvas-Based Animations**: HTML5 Canvas for dynamic celebration effects and confetti.
- **Authentication Integration**: Seamless login/logout with user state management.
- **UI/UX Decisions**: Clean, minimal design inspired by Google Tasks with an 8-bit pixel aesthetic. Features include automatic dark mode, a detailed task input form, card-based editing, a collapsible completed tasks section, consistent typography, and a CSS custom properties system for theming.

### Backend Architecture
- **Node.js/Express Server**: Provides a RESTful API with authentication middleware.
- **PostgreSQL Database**: Persistent storage for users, tasks, and lists.
- **Drizzle ORM**: Facilitates type-safe database operations and schema management.

### Core System Design
- **Main Application Controller**: `PixDoneApp` orchestrates authentication and overall application flow.
- **Animation Manager**: `AnimationManager` handles visual effects, celebrations, and an 8-bit sound system.
- **Authentication System**: Implements user login/logout with Firebase email verification.
- **Data Layer**: Hybrid storage using a database for authenticated users and localStorage for guest users, ensuring real-time UI updates.

## External Dependencies

- **Google Fonts**: 'Inter' and 'Caveat' font families.
- **Font Awesome**: Icon library.
- **Firebase Authentication**: User authentication and management.
- **Local Storage API**: Client-side data persistence for guest users.
- **Canvas API**: Rendering dynamic celebration animations.
- **Date API**: Due date calculations and reminders.