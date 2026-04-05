import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { useResolvedSemanticColorValues } from '../../stories/foundations/useResolvedCssVars';

// ─── Primitive swatches ───────────────────────────────────────────────────────

const GRAY_SCALE = [
  { step: '0',   var: '--pxd-gray-0'   },
  { step: '50',  var: '--pxd-gray-50'  },
  { step: '100', var: '--pxd-gray-100' },
  { step: '200', var: '--pxd-gray-200' },
  { step: '300', var: '--pxd-gray-300' },
  { step: '400', var: '--pxd-gray-400' },
  { step: '500', var: '--pxd-gray-500' },
  { step: '600', var: '--pxd-gray-600' },
  { step: '700', var: '--pxd-gray-700' },
  { step: '800', var: '--pxd-gray-800' },
  { step: '900', var: '--pxd-gray-900' },
];

const INK_SCALE = [
  { step: '50',  var: '--pxd-ink-50'  },
  { step: '100', var: '--pxd-ink-100' },
  { step: '200', var: '--pxd-ink-200' },
  { step: '300', var: '--pxd-ink-300' },
  { step: '400', var: '--pxd-ink-400' },
  { step: '500', var: '--pxd-ink-500' },
  { step: '600', var: '--pxd-ink-600' },
  { step: '700', var: '--pxd-ink-700' },
  { step: '800', var: '--pxd-ink-800' },
  { step: '900', var: '--pxd-ink-900' },
  { step: '950', var: '--pxd-ink-950' },
];

const COLOR_PALETTES: { name: string; swatches: { step: string; var: string }[] }[] = [
  {
    name: 'Purple',
    swatches: [
      { step: '50',  var: '--pxd-purple-50'  },
      { step: '100', var: '--pxd-purple-100' },
      { step: '300', var: '--pxd-purple-300' },
      { step: '400', var: '--pxd-purple-400' },
      { step: '500', var: '--pxd-purple-500' },
      { step: '600', var: '--pxd-purple-600' },
      { step: '700', var: '--pxd-purple-700' },
    ],
  },
  {
    name: 'Blue',
    swatches: [
      { step: '300', var: '--pxd-blue-300' },
      { step: '500', var: '--pxd-blue-500' },
      { step: '700', var: '--pxd-blue-700' },
    ],
  },
  {
    name: 'Green',
    swatches: [
      { step: '300', var: '--pxd-green-300' },
      { step: '350', var: '--pxd-green-350' },
      { step: '400', var: '--pxd-green-400' },
      { step: '500', var: '--pxd-green-500' },
      { step: '700', var: '--pxd-green-700' },
    ],
  },
  {
    name: 'Yellow',
    swatches: [
      { step: '300', var: '--pxd-yellow-300' },
      { step: '500', var: '--pxd-yellow-500' },
      { step: '700', var: '--pxd-yellow-700' },
    ],
  },
  {
    name: 'Red',
    swatches: [
      { step: '300', var: '--pxd-red-300' },
      { step: '400', var: '--pxd-red-400' },
      { step: '500', var: '--pxd-red-500' },
      { step: '700', var: '--pxd-red-700' },
    ],
  },
  {
    name: 'Pink',
    swatches: [
      { step: '300', var: '--pxd-pink-300' },
      { step: '500', var: '--pxd-pink-500' },
      { step: '700', var: '--pxd-pink-700' },
    ],
  },
  {
    name: 'Cyan',
    swatches: [
      { step: '300', var: '--pxd-cyan-300' },
      { step: '500', var: '--pxd-cyan-500' },
      { step: '700', var: '--pxd-cyan-700' },
    ],
  },
];

/** Primitive swatches only (semantic / theme docs live under Foundations PXD/Color). */
const ALL_STORY_COLOR_VARS = Array.from(
  new Set([
    ...GRAY_SCALE.map(s => s.var),
    ...INK_SCALE.map(s => s.var),
    ...COLOR_PALETTES.flatMap(p => p.swatches.map(s => s.var)),
  ]),
);

// ─── Shared styles ────────────────────────────────────────────────────────────

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--pxd-font-body)',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--pxd-color-text-tertiary)',
  marginBottom: '8px',
  marginTop: '0',
};

const h2Style: React.CSSProperties = {
  fontFamily: 'var(--pxd-font-body)',
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--pxd-color-text-primary)',
  marginBottom: '16px',
  marginTop: '32px',
  borderBottom: '1px solid var(--pxd-color-border-outline-variant)',
  paddingBottom: '8px',
};

// ─── Swatch component ─────────────────────────────────────────────────────────

function Swatch({ cssVar, label, resolved }: { cssVar: string; label: string; resolved?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '64px' }}>
      <div
        title={cssVar}
        style={{
          width: '100%',
          height: '48px',
          background: `var(${cssVar})`,
          borderRadius: '4px',
          border: '1px solid var(--pxd-color-border-outline-variant)',
        }}
      />
      <span style={{
        fontFamily: 'var(--pxd-font-mono)',
        fontSize: '10px',
        color: 'var(--pxd-color-text-secondary)',
        lineHeight: 1.3,
        wordBreak: 'break-all',
      }}>
        {label}
      </span>
      {resolved && (
        <span style={{
          fontFamily: 'var(--pxd-font-mono)',
          fontSize: '9px',
          color: 'var(--pxd-color-text-tertiary)',
          lineHeight: 1.2,
          wordBreak: 'break-all',
        }}>
          {resolved}
        </span>
      )}
    </div>
  );
}

// ─── Scale strip ─────────────────────────────────────────────────────────────

function ColorScale({
  name,
  swatches,
  resolved,
}: {
  name: string;
  swatches: { step: string; var: string }[];
  resolved: Record<string, string>;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={sectionTitle}>{name}</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {swatches.map(s => (
          <Swatch key={s.var} cssVar={s.var} label={s.step} resolved={resolved[s.var]} />
        ))}
      </div>
    </div>
  );
}

// ─── Main story component ─────────────────────────────────────────────────────

function ColorPrimitiveScales() {
  const resolved = useResolvedSemanticColorValues(ALL_STORY_COLOR_VARS);

  return (
    <div style={{
      padding: '0',
      fontFamily: 'var(--pxd-font-body)',
      color: 'var(--pxd-color-text-primary)',
      maxWidth: '900px',
    }}>

      <p style={{ fontSize: '13px', color: 'var(--pxd-color-text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
        <strong>Global primitive scales</strong> from <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: '12px' }}>tokens.css</code>
        {' '}(gray, ink, chroma). Semantic tokens, theme-specific primitives, and usage rules are documented in{' '}
        <strong>Foundations PXD → Color</strong> (sidebar).
      </p>

      <h2 style={h2Style}>Gray &amp; Ink</h2>
      <p style={{ fontSize: '13px', color: 'var(--pxd-color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        Theme-neutral base ramps. Resolved RGB reflects the current Storybook toolbars when primitives are overridden.
      </p>

      <ColorScale name="Gray  (light neutral — light mode surfaces & text)" swatches={GRAY_SCALE} resolved={resolved} />
      <ColorScale name="Ink  (cool blue-gray — dark mode surfaces & text)" swatches={INK_SCALE} resolved={resolved} />

      <h2 style={{ ...h2Style, marginTop: '40px' }}>Chroma</h2>
      <p style={{ fontSize: '13px', color: 'var(--pxd-color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        Accent and feedback hues used across themes unless a visual theme replaces semantics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginTop: '8px' }}>
        {COLOR_PALETTES.map(p => (
          <ColorScale key={p.name} name={p.name} swatches={p.swatches} resolved={resolved} />
        ))}
      </div>
    </div>
  );
}

// ─── Story definition ─────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Design System/Color primitives',
  parameters: {
    docs: {
      description: {
        component:
          '**Global primitive scales** (gray, ink, chroma) as swatch grids. For **semantic** tokens, **per-theme primitives**, and CSS usage rules, open **Foundations PXD → Color**. Use the **Color Mode** / **Visual Theme** toolbars to see resolved colors.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const PrimitiveScales: Story = {
  name: 'Primitive scales',
  render: () => <ColorPrimitiveScales />,
};
