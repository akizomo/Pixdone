# Design Tokens

**Source of truth** for every color, spacing, radius, font, shadow, and motion value in PixDone.
Compiled into CSS variables and theme TypeScript via [Style Dictionary](https://styledictionary.com/)
+ [`@tokens-studio/sd-transforms`](https://github.com/tokens-studio/sd-transforms).

```
Figma  ──Tokens Studio plugin──┐
                               ▼
                       design-tokens/*.json   ◄── source of truth
                               │
                               ▼
                     npm run tokens:build
                               │
          ┌────────────────────┴────────────────────┐
          ▼                                         ▼
app/src/design-system/                 app/src/design-system/themes/
  foundations/tokens.css                 _generated/{theme}.css-vars.ts
  (CSS :root + [data-theme="dark"])      (imported by each *.theme.ts)
```

Editing happens on the JSON. Everything downstream is generated and should
not be edited by hand.

---

## File structure

```
design-tokens/
├── $metadata.json              # Tokens Studio set order
├── $themes.json                # Tokens Studio theme/mode matrix (Figma side)
├── core.json                   # primitive palette, spacing, radius, fonts, motion
├── semantic/
│   ├── light.json              # --pd-color-* for light mode (references core)
│   └── dark.json               # --pd-color-* for dark mode (references core)
└── themes/
    ├── arcade/                 # ships default tokens — minimal overrides
    │   ├── light.json
    │   └── dark.json
    ├── synthwave/
    │   ├── light.json
    │   └── dark.json
    └── forestbit/
        ├── light.json
        └── dark.json
```

Each token file uses [W3C Design Tokens](https://design-tokens.github.io/community-group/format/)
format with Tokens Studio extensions. Cross-file references use `{path.to.token}` syntax.

Every token carries a `$extensions.pixdone` block that the build reads to
know which CSS var name to emit and which "set" it belongs to:

```json
{
  "color": {
    "surface": {
      "page": {
        "$value": "{color.gray.50}",
        "$type": "color",
        "$extensions": {
          "pixdone": {
            "cssVar": "--pd-color-surface-page",
            "set": "semanticLight"
          }
        }
      }
    }
  }
}
```

---

## Workflows

### Engineer editing tokens locally

1. Edit the JSON in `design-tokens/`. Use `{color.xxx}` references instead of raw hex where possible.
2. Run `npm run tokens:build` (from `app/`). This regenerates:
   - `app/src/design-system/foundations/tokens.css`
   - `app/src/design-system/themes/_generated/{arcade,synthwave,forestbit}.css-vars.ts`
3. Commit both the JSON changes *and* the generated outputs. (The generator runs
   automatically on `npm run build` via the `prebuild` hook, but committing generated
   files keeps diffs reviewable in PRs.)

### Designer editing tokens in Figma (via Tokens Studio)

First-time setup — one designer does this once per Figma file:

1. Install [**Tokens Studio for Figma**](https://tokens.studio/) (free tier is enough for single-user GitHub sync).
2. In the plugin, choose **Settings → Sync providers → GitHub**.
3. Create a GitHub personal access token with `repo` scope and paste it in.
4. Point the plugin at:
   - Repository: `<org>/Bitdone`
   - Branch: create and use `design/tokens` (or work on a feature branch)
   - File path: `design-tokens` (directory mode — the plugin reads/writes the multi-file layout)
5. Click **Save** then **Pull**. The plugin will load `core`, `semantic/light`, `semantic/dark`, and the three themes as Token Sets.
6. Open the **Themes** panel. You'll see these theme entries (defined by `$themes.json`):
   - `Base Light` / `Base Dark` — the default palette, no visual theme applied
   - `arcade Light` / `arcade Dark` — default visual theme (effectively the same as base, plus a few primitives)
   - `synthwave Light` / `synthwave Dark`
   - `forestbit Light` / `forestbit Dark`
7. For each theme entry, click **Create Styles + Variables**. The plugin creates Figma Variables with a Mode per theme+mode combination.

Day-to-day editing:

1. **Pull** in the plugin (always do this first) to fetch the latest JSON.
2. Edit tokens in the plugin or directly on Figma layers (Tokens Studio rewrites the JSON when you change a variable binding).
3. **Push** → the plugin commits JSON changes to `design/tokens` branch.
4. Open a PR from `design/tokens` → `main`. CI runs `npm run tokens:build` to regenerate CSS/TS artifacts. Engineer reviews and merges.

### CI / automated builds

`npm run build` triggers `npm run tokens:build` via the `prebuild` hook, so every
production deploy regenerates `tokens.css` and theme css-vars from the current
JSON. If you commit stale generated files that don't match the JSON, they will
be overwritten at build time.

---

## Conventions

### Prefix rules

- `--pd-*` — **theme-invariant** tokens (primitive palettes, spacing, radius, typography) and the canonical **semantic** layer (`--pd-color-surface-page` etc.). Defined in `core.json` and `semantic/{light,dark}.json`.
- `--pd-*` — legacy **component-level** tokens that themes override directly (accent, smash gradients, font stacks, effect particles). Only themes touch these; base tokens never define them.

### color-mix / alpha

Where the original CSS used
`color-mix(in srgb, var(--pd-sw-chrome) 22%, transparent)`, the JSON encodes
this as a reference to `{sw.chrome}` plus a Tokens Studio alpha modifier:

```json
{
  "$value": "{sw.chrome}",
  "$type": "color",
  "$extensions": {
    "pixdone": { "cssVar": "--pd-color-border-outline-variant", "set": "themeSynthwaveDark" },
    "studio.tokens.modify": { "type": "alpha", "value": "0.2200", "space": "srgb" }
  }
}
```

The build restores the original `color-mix(...)` CSS expression so the
reference stays live (if `--pd-sw-chrome` changes at runtime, all derivatives
update). Designers in Figma see the token as the base color + an alpha
modifier — Tokens Studio handles this natively.

### Mode-specific token paths collide

`semantic/light.json` and `semantic/dark.json` both define `color.surface.page`.
The build runs **separate passes per mode** so the paths don't collide in
Style Dictionary's in-memory dictionary. Don't try to merge a single JSON file
across both modes.

### Non-token theme metadata

Fields like `effectsStyle`, `soundPackKey`, `fontImportUrl`, `description`,
`icon`, `isPremium` live in `app/src/design-system/themes/*.theme.ts` — they
are not tokens and are not synced with Figma.

---

## Scripts

From `app/`:

| Command | What it does |
|---|---|
| `npm run tokens:build` | Regenerate `tokens.css` and theme `*.css-vars.ts` from JSON. |
| `npm run tokens:extract` | **One-shot bootstrapping tool.** Parses the legacy hand-authored `tokens.css` and theme TS files and rewrites `design-tokens/*.json`. Only run if you need to re-derive the JSON from CSS — normally you edit JSON directly. |
| `npm run build` | Runs `tokens:build` automatically (via `prebuild`) then `tsc -b && vite build`. |

---

## Legacy `pixdone.tokens.json`

The file `design-tokens/pixdone.tokens.json` and the docs in
`docs/design-system/` refer to an **earlier** token layout that is no longer
wired into the app (it was only ever referenced from a doc comment in
`src/design-system/tokens.ts`). It is kept for historical reference and can
be removed once the old `docs/design-system/` pages are updated.
