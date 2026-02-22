---
name: Pager swipe for list tabs
overview: Add a mobile-first horizontal swipe pager to switch between task lists, using Pointer Events and a minimal pager DOM structure, while replacing the existing touch-swipe implementation.
todos: []
isProject: false
---

# Horizontal Swipe Pager for List Tabs

## Step 1 — Analysis Summary

### List tabs and active state

- **Tabs**: `[public/script.js](public/script.js)` `renderListTabs()` (L5991–6029) populates `#listTabs` with `.list-tab` buttons
- **Active list**: `this.currentListId` (L9); `getCurrentList()` returns `this.lists.find(list => list.id === this.currentListId)`
- **Switch flow**: Tab click → `switchToList(listId)` → `currentListId` update → `renderListTabs()` + `renderTasks()` + `updateListTitle()` + `updateCompletedCount()`

### DOM structure

- **Content area**: `.task-list-container` (L176 index.html) wraps `.task-list#taskList`, empty states, and `#completedSection`
- **Scroll**: Document/body scrolls; `.task-list-container` has no overflow. Task items use `touch-action: pan-y` on touch devices (style.css L1653)
- **Content layout**: `.task-list-container` is flex column; `.task-list` is the main task list

### Existing touch handlers (to replace)

- **File**: `script.js` L2134–2274
- **Target**: `mainContainer` = `.task-list-container` or `.app-container`
- **Events**: touchstart (passive:true), touchmove (passive:false), touchend (passive:true)
- **Lock**: `deltaX > 10 && deltaX > deltaY * 1.5`
- **Threshold**: 80px absolute delta
- **Effect**: Applies `translateX` to `.task-list-container`, calls `switchToPreviousList()` / `switchToNextList()`

### Risk summary


| Risk                                | Mitigation                                                                                                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Vertical scroll vs horizontal swipe | Lock only if `abs(dx) > 8 && abs(dx) > abs(dy) * 1.2`; no `preventDefault` before lock                                     |
| Passive listeners                   | Use pointer events; call `preventDefault()` only after horizontal lock                                                     |
| Overflow layout                     | `.pager-viewport` gets `overflow-x: hidden`; vertical remains `visible` or `auto` per page                                 |
| Task drag conflict                  | Skip when `e.target.closest('.task-item')` is dragging (same as existing skip for `.task-checkbox`, `.task-actions`, etc.) |
| Multiple lists                      | Pager needs N pages; render logic must support rendering per page                                                          |


---

## Step 2 — Pager DOM Structure (minimal)

### Proposed structure

```
.app-container
  ...
  .pager-viewport          <- NEW wrapper (overflow-x: hidden)
    .pager-track           <- flex, translateX
      .pager-page (x N)    <- width: 100%
        .task-list-wrapper <- contains existing task-list-container content per list
```

### Approach: single content slot (minimal)

To avoid large refactors of `renderTasks()` (which uses global `#taskList`, `#emptyState`, etc.), use a **virtual pager**:

- `.pager-viewport` wraps `.pager-track` with N `.pager-page` placeholders
- Only the **active** page holds the live content: move the existing `.task-list-container` DOM into the active `.pager-page`
- On swipe: translate the track for drag feedback; on commit, call `switchToList()` and move content into the new active page (or re-append and reset transform)

This keeps `renderTasks()` unchanged and limits changes to:

1. Wrapping the content area in the pager
2. Syncing which page is active and moving the content container

### Alternative (if full per-page content is required)

Create N `.pager-page` nodes, each with its own `.task-list`, empty states, completed section. Add `renderListIntoPage(list, pageEl)` that reuses the same logic as `renderTasks()` but with a target container. This is a larger refactor.

**Recommendation**: Use the virtual pager (single content slot) for the smallest safe change.

---

## Step 3 — Implementation Plan

### Files to change


| File                                     | Changes                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `[public/index.html](public/index.html)` | Wrap `.task-list-container` in `.pager-viewport` > `.pager-track` > `.pager-page`   |
| `[public/style.css](public/style.css)`   | Add pager layout: viewport overflow, track flex, page width                         |
| `[public/script.js](public/script.js)`   | Replace `setupTouchGestures` with pager + pointer handlers; add `setupPagerSwipe()` |


### A. index.html

```html
<!-- Before -->
<div class="task-list-container"> ... </div>

<!-- After -->
<div class="pager-viewport">
  <div class="pager-track">
    <div class="pager-page" data-page-index="0">
      <div class="task-list-container"> ... </div>
    </div>
  </div>
</div>
```

Initially: one `.pager-page` containing the current `.task-list-container`. Pages are created/removed in JS when lists change (see below).

### B. style.css

```css
.pager-viewport {
  overflow-x: hidden;
  overflow-y: visible;
  width: 100%;
  position: relative;
}

.pager-track {
  display: flex;
  width: 100%;
  will-change: transform;
  /* translateX applied via inline style */
}

.pager-page {
  flex: 0 0 100%;
  width: 100%;
  min-width: 0;
}
```

### C. script.js — Pager setup and pointer handlers

1. `**setupPagerSwipe()**` (replaces `setupTouchGestures` or is called after it is removed):
  - Get `.pager-viewport` and `.pager-track`
  - Build/update `.pager-page` nodes to match `this.lists.length`
  - Put the single `.task-list-container` into the active page
  - Attach pointerdown, pointermove, pointerup, pointercancel to `.pager-viewport`
2. **Pointer handler logic** (with inline comments):
  - **pointerdown**: Record `startX`, `startY`, `pointerId`; set `isLocked = false`
  - **pointermove**: Compute `dx`, `dy`. If not locked: if `abs(dx) > 8 && abs(dx) > abs(dy) * 1.2`, set `isLocked = true` and `e.preventDefault()`. If locked: apply `transform: translateX(...)` to track (no transition), `e.preventDefault()`
  - **pointerup/pointercancel**: If locked, compute threshold (25% viewport width) and velocity; if switch, call `switchToPreviousList()` or `switchToNextList()`; else snap back. Set `transition: transform 220ms ease-out` for snap.
3. **List sync**: When `renderListTabs()` runs (or when `switchToList` completes), ensure the active `.pager-page` contains the content and the track `translateX` is `-currentIndex * 100%`.
4. **Remove or disable** the existing touch handlers in `setupTouchGestures` for the list-switch behavior (or remove `setupTouchGestures` and replace with `setupPagerSwipe`).

---

## Step 4 — Gesture logic (pseudocode)

```javascript
// Lock threshold: only lock horizontal if clearly horizontal
// Before lock: do NOT preventDefault (allows vertical scroll)
if (!isLocked && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
  isLocked = true;
  e.preventDefault();
}

// During drag: apply transform, no CSS transition
track.style.transition = 'none';
track.style.transform = `translateX(${baseOffset + dx}px)`;  // baseOffset = -currentIndex * viewportWidth

// On release: switch if abs(dx) > 25% width OR velocity > 0.5
const viewportWidth = pagerViewport.offsetWidth;
const switchThreshold = viewportWidth * 0.25;
const velocity = Math.abs(dx) / (Date.now() - startTime);
if (Math.abs(dx) > switchThreshold || velocity > 0.5) {
  if (dx > 0) switchToPreviousList();
  else switchToNextList();
}
// Snap: transition 220ms ease-out
```

---

## Step 5 — Preserved behavior

- Tab click still calls `switchToList(listId)` (unchanged)
- `switchToList` updates `currentListId`, `renderListTabs`, `renderTasks`, underline
- Desktop: pointer events work for mouse (pointerdown/up), drag optional
- Existing skip conditions (modals, input visible, interactive elements) kept

---

## Step 6 — Minimal DOM / CSS constraints

- Current layout: `.task-list-container` is flex column; no overflow on it
- After wrap: `.pager-viewport` clips horizontally; vertical remains in document flow
- If pages must scroll vertically per page: add `overflow-y: auto` and a fixed height to `.pager-page`; this may change layout and is optional for the minimal change

---

## Deliverables

1. **Diff summary**: index.html (wrap), style.css (pager classes), script.js (new setupPagerSwipe, remove/replace touch handlers)
2. **Comments**: Inline comments for lock logic (`abs(dx) > 8`, `abs(dx) > abs(dy) * 1.2`), 25% threshold, velocity, and when `preventDefault` is called
3. **No libraries**: Vanilla JS only

