/**
 * FreezeEffect - Vanilla JS 8-bit Freeze Overlay
 * ================================================
 * A framework-agnostic, reusable completion effect module.
 *
 * Usage:
 *   <script src="/freeze-effect.js"></script>
 *   <script>
 *     const freeze = new FreezeEffect({ color: '#00e8ff', duration: 2400 });
 *     freeze.trigger();
 *   </script>
 *
 * Or as ES Module:
 *   import { FreezeEffect } from './freeze-effect.js';
 *   const freeze = new FreezeEffect();
 *   freeze.trigger().then(() => console.log('done'));
 *
 * Options:
 *   color       - Primary frost color (default: '#00e8ff')
 *   duration    - Total animation duration in ms (default: 2400)
 *   text        - Text to display (default: 'FREEZE')
 *   textStyle   - 'font' = VT323 text (match app effects), 'pixel' = 5x5 grid (default: 'pixel')
 *   pixelSize   - Base pixel unit size (default: 6)
 *   showPenguin - Show the pixel penguin mascot (default: true)
 *   penguinImageUrl - If set, use this image for penguin (e.g. same as "Are you frozen?" idle asset)
 *   showCracks  - Show crack lines (default: true)
 *   particles   - Number of frost particles (default: 60)
 *   zIndex      - Base z-index for overlay layers (default: 9999)
 *   onStart     - Callback when animation starts
 *   onComplete  - Callback when animation finishes
 */

;(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory)
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory()
  } else {
    root.FreezeEffect = factory()
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict"

  // ── Utility helpers ──────────────────────────────────────────────

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return { r, g, b }
  }

  function rgbaDim(hex, alpha) {
    const { r, g, b } = hexToRgb(hex)
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")"
  }

  function darkenHex(hex, factor) {
    const { r, g, b } = hexToRgb(hex)
    const f = 1 - factor
    const dr = Math.round(r * f)
    const dg = Math.round(g * f)
    const db = Math.round(b * f)
    return (
      "#" +
      dr.toString(16).padStart(2, "0") +
      dg.toString(16).padStart(2, "0") +
      db.toString(16).padStart(2, "0")
    )
  }

  function lightenHex(hex, factor) {
    const { r, g, b } = hexToRgb(hex)
    const lr = Math.min(255, Math.round(r + (255 - r) * factor))
    const lg = Math.min(255, Math.round(g + (255 - g) * factor))
    const lb = Math.min(255, Math.round(b + (255 - b) * factor))
    return (
      "#" +
      lr.toString(16).padStart(2, "0") +
      lg.toString(16).padStart(2, "0") +
      lb.toString(16).padStart(2, "0")
    )
  }

  function el(tag, styles, parent) {
    const node = document.createElement(tag)
    if (styles) Object.assign(node.style, styles)
    if (parent) parent.appendChild(node)
    return node
  }

  // ── Pixel letter definitions (5x5 grid each) ────────────────────

  var PIXEL_FONT = {
    A: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    B: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
    ],
    C: [
      [0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
    ],
    D: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
    ],
    E: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    F: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ],
    G: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    H: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    I: [
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    K: [
      [1, 0, 0, 1, 0],
      [1, 0, 1, 0, 0],
      [1, 1, 0, 0, 0],
      [1, 0, 1, 0, 0],
      [1, 0, 0, 1, 0],
    ],
    L: [
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    M: [
      [1, 0, 0, 0, 1],
      [1, 1, 0, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
    ],
    N: [
      [1, 0, 0, 0, 1],
      [1, 1, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 1, 1],
      [1, 0, 0, 0, 1],
    ],
    O: [
      [0, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    P: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ],
    R: [
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 1, 0],
      [1, 0, 0, 0, 1],
    ],
    S: [
      [0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 1],
      [1, 1, 1, 1, 0],
    ],
    T: [
      [1, 1, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    U: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
    W: [
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 0, 1, 1],
      [1, 0, 0, 0, 1],
    ],
    X: [
      [1, 0, 0, 0, 1],
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 1, 0],
      [1, 0, 0, 0, 1],
    ],
    Z: [
      [1, 1, 1, 1, 1],
      [0, 0, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 0, 0, 0],
      [1, 1, 1, 1, 1],
    ],
    "!": [
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    " ": [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  }

  // ── Penguin pixel art (10x12) ────────────────────────────────────

  var PENGUIN_GRID = [
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 2, 2, 2, 2, 1, 1, 0],
    [0, 1, 2, 4, 2, 2, 4, 2, 1, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 2, 3, 3, 2, 1, 1, 0],
    [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 2, 1, 1, 1, 1, 1, 1, 2, 1],
    [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 3, 0, 0, 3, 0, 0, 0],
  ]

  // ── Crack path generator ────────────────────────────────────────

  function generateCrackPath(startX, startY, length, seed) {
    var points = []
    var x = startX
    var y = startY
    var dir = seed % 2 === 0 ? 1 : -1

    for (var i = 0; i < length; i++) {
      points.push({ x: x, y: y })
      x += (4 + (((seed * (i + 1)) % 3) * 2)) * dir
      y += ((seed * (i + 2)) % 5) - 2
      if (i % 7 === 0) dir *= -1
    }

    return points
  }

  // ── Inject keyframes once into <head> ───────────────────────────

  var stylesInjected = false

  function injectStyles() {
    if (stylesInjected) return
    stylesInjected = true

    var css = [
      "@keyframes freeze-effect-fadein  { from { opacity: 0 } to { opacity: 1 } }",
      "@keyframes freeze-effect-fadeout { from { opacity: 1 } to { opacity: 0 } }",
      "@keyframes freeze-text-shake {",
      "  0%, 100% { transform: translate(0, 0); }",
      "  33% { transform: translate(1px, -1px); }",
      "  66% { transform: translate(-1px, 1px); }",
      "}",
      "@keyframes freeze-penguin-shake {",
      "  0%, 100% { transform: translate(0, 0); }",
      "  33% { transform: translate(1px, -1px); }",
      "  66% { transform: translate(-1px, 1px); }",
      "}",
      ".freeze-text-shake { animation: freeze-text-shake 0.1s steps(2) infinite; }",
      ".freeze-penguin-shake { animation: freeze-penguin-shake 0.1s steps(2) infinite; }",
      "@media (prefers-reduced-motion: reduce) {",
      "  .freeze-text-shake, .freeze-penguin-shake { animation: none; }",
      "}",
    ].join("\n")

    var style = document.createElement("style")
    style.textContent = css
    document.head.appendChild(style)
  }

  // ── Main class ──────────────────────────────────────────────────

  function FreezeEffect(options) {
    var opts = options || {}

    this.color = opts.color || "#00e8ff"
    this.duration = opts.duration || 2400
    this.text = opts.text || "FREEZE"
    this.textStyle = opts.textStyle || "pixel"
    this.pixelSize = opts.pixelSize || 6
    this.showPenguin = opts.showPenguin !== undefined ? opts.showPenguin : true
    this.penguinImageUrl = opts.penguinImageUrl || null
    this.showCracks = opts.showCracks !== undefined ? opts.showCracks : true
    this.particleCount = opts.particles || 60
    this.zIndex = opts.zIndex || 9999
    this.onStart = opts.onStart || null
    this.onComplete = opts.onComplete || null

    this._running = false
    this._container = null
    this._timers = []
  }

  // ── Public API ──────────────────────────────────────────────────

  /**
   * Trigger the freeze effect.
   * Returns a Promise that resolves when the animation completes.
   */
  FreezeEffect.prototype.trigger = function () {
    var self = this

    if (this._running) return Promise.resolve()

    injectStyles()

    this._running = true
    if (this.onStart) this.onStart()

    return new Promise(function (resolve) {
      self._run(function () {
        self._running = false
        if (self.onComplete) self.onComplete()
        resolve()
      })
    })
  }

  /**
   * Destroy and clean up immediately.
   */
  FreezeEffect.prototype.destroy = function () {
    this._timers.forEach(function (t) {
      clearTimeout(t)
    })
    this._timers = []

    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container)
    }
    if (this._centerGroup && this._centerGroup.parentNode) {
      this._centerGroup.parentNode.removeChild(this._centerGroup)
    }
    this._container = null
    this._centerGroup = null
    this._penguinEl = null
    this._running = false
  }

  /**
   * Update options on the fly.
   */
  FreezeEffect.prototype.configure = function (newOpts) {
    if (newOpts.color !== undefined) this.color = newOpts.color
    if (newOpts.duration !== undefined) this.duration = newOpts.duration
    if (newOpts.text !== undefined) this.text = newOpts.text
    if (newOpts.textStyle !== undefined) this.textStyle = newOpts.textStyle
    if (newOpts.pixelSize !== undefined) this.pixelSize = newOpts.pixelSize
    if (newOpts.showPenguin !== undefined) this.showPenguin = newOpts.showPenguin
    if (newOpts.penguinImageUrl !== undefined) this.penguinImageUrl = newOpts.penguinImageUrl
    if (newOpts.showCracks !== undefined) this.showCracks = newOpts.showCracks
    if (newOpts.particles !== undefined) this.particleCount = newOpts.particles
    if (newOpts.zIndex !== undefined) this.zIndex = newOpts.zIndex
    if (newOpts.onStart !== undefined) this.onStart = newOpts.onStart
    if (newOpts.onComplete !== undefined) this.onComplete = newOpts.onComplete
    return this
  }

  // ── Internal: build & run the animation ─────────────────────────

  FreezeEffect.prototype._schedule = function (fn, ms) {
    var id = setTimeout(fn, ms)
    this._timers.push(id)
    return id
  }

  FreezeEffect.prototype._run = function (done) {
    var self = this
    var w = window.innerWidth
    var h = window.innerHeight
    var color = this.color
    var colorLight = lightenHex(color, 0.5)
    var colorDark = darkenHex(color, 0.5)
    var PX = this.pixelSize
    var Z = this.zIndex

    // Timing ratios (proportional to total duration)
    var dur = this.duration
    var tHit = 0
    var tFreeze = Math.round(dur * 0.033) // ~80ms at 2400
    var tPenguin = Math.round(dur * 0.167) // ~400ms
    var tCrack = Math.round(dur * 0.375) // ~900ms
    var tText = Math.round(dur * 0.5) // ~1200ms
    var tClear = dur
    var tDone = dur + 200

    // ─ Phase 1: Flash frame ──────────────────
    var flash = el("div", {
      position: "fixed",
      inset: "0",
      zIndex: String(Z),
      backgroundColor: colorLight,
      opacity: "0.5",
      imageRendering: "pixelated",
      pointerEvents: "none",
    })
    document.body.appendChild(flash)

    // ─ Phase 2: Main overlay container ───────
    var container = el("div", {
      position: "fixed",
      inset: "0",
      zIndex: String(Z + 1),
      pointerEvents: "none",
      opacity: "0",
      transition: "opacity 0.08s steps(2)",
    })
    document.body.appendChild(container)
    this._container = container

    // Dark tint
    var tint = el(
      "div",
      {
        position: "absolute",
        inset: "0",
        backgroundColor: "#0a1828",
        opacity: "0",
        transition: "opacity 0.05s steps(1)",
      },
      container
    )

    // Frost texture tiles
    var tilesWrap = el(
      "div",
      {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        opacity: "0",
        transition: "opacity 0.05s steps(1)",
      },
      container
    )

    for (var i = 0; i < 200; i++) {
      el(
        "div",
        {
          position: "absolute",
          left: Math.floor(Math.random() * 100) + "%",
          top: Math.floor(Math.random() * 100) + "%",
          width: (2 + Math.floor(Math.random() * 6)) + "%",
          height: (2 + Math.floor(Math.random() * 4)) + "%",
          backgroundColor: colorLight,
          opacity: String(0.03 + Math.random() * 0.1),
          imageRendering: "pixelated",
        },
        tilesWrap
      )
    }

    // Border frost - top
    var borderTop = el(
      "div",
      {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "16px",
        opacity: "0",
        transition: "opacity 0.05s steps(1)",
        display: "flex",
      },
      container
    )

    for (var bi = 0; bi < 80; bi++) {
      el(
        "div",
        {
          flex: "1",
          height: (8 + (bi % 3) * 4) + "px",
          backgroundColor: bi % 2 === 0 ? color : colorLight,
          opacity: String(0.4 + (bi % 4) * 0.1),
          imageRendering: "pixelated",
        },
        borderTop
      )
    }

    // Border frost - bottom
    var borderBot = el(
      "div",
      {
        position: "absolute",
        bottom: "0",
        left: "0",
        right: "0",
        height: "12px",
        opacity: "0",
        transition: "opacity 0.05s steps(1)",
        display: "flex",
        alignItems: "flex-end",
      },
      container
    )

    for (var bj = 0; bj < 80; bj++) {
      el(
        "div",
        {
          flex: "1",
          height: (6 + (bj % 3) * 3) + "px",
          backgroundColor: bj % 2 === 0 ? darkenHex(color, 0.1) : lightenHex(color, 0.35),
          opacity: String(0.35 + (bj % 3) * 0.1),
          imageRendering: "pixelated",
        },
        borderBot
      )
    }

    // Frost particles
    var particleEls = []
    for (var pi = 0; pi < this.particleCount; pi++) {
      var pDelay = Math.floor(Math.random() * 200)
      var particle = el(
        "div",
        {
          position: "absolute",
          left: Math.floor(Math.random() * w) + "px",
          top: Math.floor(Math.random() * h) + "px",
          width: (4 + Math.floor(Math.random() * 3) * 4) + "px",
          height: (4 + Math.floor(Math.random() * 3) * 4) + "px",
          backgroundColor: "transparent",
          opacity: "0",
          imageRendering: "pixelated",
          transition:
            "opacity 0.05s steps(1) " + pDelay + "ms, background-color 0.05s steps(1) " + pDelay + "ms",
        },
        container
      )
      particleEls.push(particle)
    }

    // Ice crystal blocks
    var crystalPositions = [
      { top: "15%", left: "10%", w: 24, h: 24 },
      { top: "25%", right: "15%", w: 16, h: 32 },
      { bottom: "30%", left: "25%", w: 20, h: 12 },
    ]
    var crystalEls = []
    crystalPositions.forEach(function (pos) {
      var style = {
        position: "absolute",
        width: pos.w + "px",
        height: pos.h + "px",
        backgroundColor: color,
        opacity: "0",
        imageRendering: "pixelated",
        transition: "opacity 0.05s steps(1)",
      }
      if (pos.top) style.top = pos.top
      if (pos.left) style.left = pos.left
      if (pos.right) style.right = pos.right
      if (pos.bottom) style.bottom = pos.bottom
      var crystal = el("div", style, container)
      crystalEls.push(crystal)
    })

    // Crack elements (pre-build but hidden)
    var crackEls = []
    if (this.showCracks) {
      var allCracks = []
        .concat(generateCrackPath(w * 0.3, h * 0.2, 25, 7))
        .concat(generateCrackPath(w * 0.6, h * 0.5, 20, 3))
        .concat(generateCrackPath(w * 0.4, h * 0.7, 18, 11))

      allCracks.forEach(function (pt) {
        var crack = el(
          "div",
          {
            position: "absolute",
            left: pt.x + "px",
            top: pt.y + "px",
            width: "4px",
            height: "2px",
            backgroundColor: "#f0f8ff",
            opacity: "0",
            imageRendering: "pixelated",
          },
          container
        )
        crackEls.push(crack)
      })
    }

    // Center group: FREEZE text + penguin below it
    var centerGroup = el("div", {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      zIndex: String(Z + 2),
      pointerEvents: "none",
    })
    document.body.appendChild(centerGroup)
    this._centerGroup = centerGroup

    var textWrap = this._buildPixelText(centerGroup, PX, color, colorDark)
    textWrap.style.position = "relative"
    textWrap.style.top = "auto"
    textWrap.style.left = "auto"
    textWrap.style.transform = "none"

    var penguinEl = null
    if (this.showPenguin) {
      penguinEl = this._buildPenguin(PX, color, Z + 2)
      if (penguinEl) centerGroup.appendChild(penguinEl)
    }

    // ── Timeline ──────────────────────────────────────────────────

    // Remove flash
    self._schedule(function () {
      if (flash.parentNode) flash.parentNode.removeChild(flash)
    }, tFreeze)

    // Show frost overlay
    self._schedule(function () {
      container.style.opacity = "1"
      container.style.pointerEvents = "auto"
      tint.style.opacity = "0.55"
      tilesWrap.style.opacity = "1"
      borderTop.style.opacity = "1"
      borderBot.style.opacity = "1"
      particleEls.forEach(function (p) {
        p.style.backgroundColor = rgbaDim(color, 0.7)
        p.style.opacity = "0.7"
      })
      crystalEls.forEach(function (c, idx) {
        c.style.opacity = String(0.2 + idx * 0.05)
      })
    }, tFreeze)

    // Penguin entrance (with shake) – below FREEZE text
    if (penguinEl) {
      self._schedule(function () {
        penguinEl.style.opacity = "1"
        penguinEl.style.transform = "translateY(0)"
        penguinEl.classList.add("freeze-penguin-shake")
      }, tPenguin)
    }

    // Cracks
    if (this.showCracks) {
      self._schedule(function () {
        crackEls.forEach(function (c) {
          c.style.opacity = "0.7"
        })
      }, tCrack)
    }

    // Text (with shake)
    self._schedule(function () {
      textWrap.style.opacity = "1"
      textWrap.classList.add("freeze-text-shake")
    }, tText)

    // Clear
    self._schedule(function () {
      container.style.opacity = "0"
      if (penguinEl) {
        penguinEl.classList.remove("freeze-penguin-shake")
        penguinEl.style.opacity = "0"
        penguinEl.style.transform = "translateY(8px)"
      }
    }, tClear)

    // Cleanup
    self._schedule(function () {
      self.destroy()
      done()
    }, tDone)
  }

  // ── Build text element (font style = match app effects, pixel = 5x5 grid) ─────

  FreezeEffect.prototype._buildPixelText = function (parent, PX, color, borderColor) {
    var wrap = el(
      "div",
      {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: String(this.zIndex + 3),
        opacity: "0",
        transition: "opacity 0.05s steps(1)",
      },
      parent
    )

    if (this.textStyle === "font") {
      wrap.style.display = "block"
      wrap.style.textAlign = "center"
      wrap.style.fontFamily = "'VT323', 'Courier New', monospace"
      wrap.style.fontWeight = "bold"
      wrap.style.fontSize = "32px"
      wrap.style.color = color
      wrap.style.letterSpacing = "0.08em"
      wrap.style.textShadow =
        "2px 2px 0px #000, -2px -2px 0px #fff, 0 0 8px " + color + "80"
      wrap.style.imageRendering = "pixelated"
      wrap.textContent = this.text.toUpperCase()
      return wrap
    }

    var text = this.text.toUpperCase()
    var GAP = Math.round(PX * 1.3)
    wrap.style.display = "flex"
    wrap.style.gap = GAP + "px"
    wrap.style.imageRendering = "pixelated"

    for (var li = 0; li < text.length; li++) {
      var ch = text[li]
      var grid = PIXEL_FONT[ch]
      if (!grid) continue

      var letterEl = el(
        "div",
        {
          display: "grid",
          gridTemplateColumns: "repeat(5, " + PX + "px)",
          gridTemplateRows: "repeat(5, " + PX + "px)",
        },
        wrap
      )

      for (var ci = 0; ci < grid.length; ci++) {
        for (var cj = 0; cj < grid[ci].length; cj++) {
          var filled = grid[ci][cj]
          el(
            "div",
            {
              width: PX + "px",
              height: PX + "px",
              backgroundColor: filled ? color : "transparent",
              boxShadow: filled ? "0 0 0 1px " + borderColor : "none",
            },
            letterEl
          )
        }
      }
    }

    return wrap
  }

  // ── Build penguin element ───────────────────────────────────────
  // When penguinImageUrl is set, use same asset as "Are you frozen?" idle effect (img).
  // Otherwise use pixel-grid penguin.
  FreezeEffect.prototype._buildPenguin = function (PX, eyeColor, z) {
    var wrap = el("div", {
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity 0.15s steps(2), transform 0.15s steps(2)",
      pointerEvents: "none",
    })

    if (this.penguinImageUrl) {
      var img = document.createElement("img")
      img.src = this.penguinImageUrl
      img.alt = "Penguin"
      img.setAttribute("aria-hidden", "true")
      Object.assign(img.style, {
        width: "64px",
        height: "64px",
        objectFit: "contain",
        objectPosition: "center",
        display: "block",
      })
      wrap.appendChild(img)
      return wrap
    }

    var penguinPx = Math.max(4, PX - 1)
    var colors = {
      0: "transparent",
      1: "#0a0a14",
      2: "#e8e8f0",
      3: "#e07828",
      4: eyeColor,
    }
    wrap.style.imageRendering = "pixelated"

    var grid = el(
      "div",
      {
        display: "grid",
        gridTemplateColumns: "repeat(10, " + penguinPx + "px)",
        gridTemplateRows: "repeat(12, " + penguinPx + "px)",
      },
      wrap
    )

    PENGUIN_GRID.forEach(function (row) {
      row.forEach(function (c) {
        el(
          "div",
          {
            width: penguinPx + "px",
            height: penguinPx + "px",
            backgroundColor: colors[c],
          },
          grid
        )
      })
    })

    return wrap
  }

  return FreezeEffect
})
