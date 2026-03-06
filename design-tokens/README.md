# PixDone Design Tokens

`pixdone.tokens.json` is the source of truth for the PixDone design system. The React app compiles these to CSS variables with the `--pd-` prefix.

## Mapping to CSS Variables

- **Color (dark)**: `pixdone.color.*` → `--pd-color-*` (e.g. `color.background.default` → `--pd-color-background-default`)
- **Color (light)**: `pixdone.colorLight.*` → same structure; theme is switched via `ThemeProvider`
- **Accent**: `accent.subtle` = selected chip / subtle accent background (`rgba(26, 115, 232, 0.15)`).
- **Focus**: `focus.ring` and `focus.insetShadow` for input focus styles (pixel-style inset + ring).
- **Smash**: `smash.border`, `smash.text`, `smash.hint`, `smash.gradientStart`, `smash.gradientEnd` for the Smash list panel (purple palette).
- **Typography**: `typography.fontFamily.*` → `--pd-font-*`; `typography.scale.*` → `--pd-type-*`
- **Space**: `space.*` → `--pd-space-*`
- **Radius**: `radius.*` → `--pd-radius-*`
- **Border**: `border.*` → `--pd-border-*`
- **Motion**: `motion.duration.*` → `--pd-motion-duration-*`; `motion.easing.*` → `--pd-motion-easing-*`
- **Sound**: keys are used in JS only (e.g. `comicEffects.playSound(token.value)`)

The React theme layer in `src/design-system/theme/` reads this JSON (or a TypeScript export) and injects CSS variables into the document root.
