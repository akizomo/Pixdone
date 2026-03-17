import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';

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

// ─── Semantic groups ──────────────────────────────────────────────────────────

const SEMANTIC_GROUPS: { name: string; tokens: { label: string; var: string; on?: string }[] }[] = [
  {
    name: 'Surface',
    tokens: [
      { label: 'page',     var: '--pxd-color-surface-page'     },
      { label: 'page-alt', var: '--pxd-color-surface-page-alt' },
      { label: 'primary',  var: '--pxd-color-surface-primary'  },
      { label: 'secondary',var: '--pxd-color-surface-secondary'},
      { label: 'raised',   var: '--pxd-color-surface-raised'   },
      { label: 'disabled', var: '--pxd-color-surface-disabled' },
      { label: 'inverse',  var: '--pxd-color-surface-inverse'  },
      { label: 'overlay',  var: '--pxd-color-surface-overlay'  },
    ],
  },
  {
    name: 'Text',
    tokens: [
      { label: 'primary',   var: '--pxd-color-text-primary'   },
      { label: 'secondary', var: '--pxd-color-text-secondary' },
      { label: 'tertiary',  var: '--pxd-color-text-tertiary'  },
      { label: 'disabled',  var: '--pxd-color-text-disabled'  },
      { label: 'inverse',   var: '--pxd-color-text-inverse'   },
      { label: 'accent',    var: '--pxd-color-text-accent'    },
      { label: 'success',   var: '--pxd-color-text-success'   },
      { label: 'warning',   var: '--pxd-color-text-warning'   },
      { label: 'danger',    var: '--pxd-color-text-danger'    },
    ],
  },
  {
    name: 'Border',
    tokens: [
      { label: 'outline-variant',    var: '--pxd-color-border-outline-variant'    },
      { label: 'outline',            var: '--pxd-color-border-outline'            },
      { label: 'interactive',        var: '--pxd-color-border-interactive'        },
      { label: 'interactive-active', var: '--pxd-color-border-interactive-active' },
      { label: 'focus',   var: '--pxd-color-border-focus'   },
      { label: 'danger',  var: '--pxd-color-border-danger'  },
      { label: 'inverse', var: '--pxd-color-border-inverse' },
    ],
  },
  {
    name: 'Feedback',
    tokens: [
      { label: 'info',    var: '--pxd-color-feedback-info'    },
      { label: 'success', var: '--pxd-color-feedback-success' },
      { label: 'warning', var: '--pxd-color-feedback-warning' },
      { label: 'danger',  var: '--pxd-color-feedback-danger'  },
    ],
  },
  {
    name: 'Action',
    tokens: [
      { label: 'primary',            var: '--pxd-color-action-primary'           },
      { label: 'primary-hover',      var: '--pxd-color-action-primary-hover'     },
      { label: 'primary-pressed',    var: '--pxd-color-action-primary-pressed'   },
      { label: 'secondary',          var: '--pxd-color-action-secondary'         },
      { label: 'secondary-hover',    var: '--pxd-color-action-secondary-hover'   },
      { label: 'secondary-pressed',  var: '--pxd-color-action-secondary-pressed' },
      { label: 'ghost-hover',        var: '--pxd-color-action-ghost-hover'       },
      { label: 'ghost-pressed',      var: '--pxd-color-action-ghost-pressed'     },
      { label: 'disabled',           var: '--pxd-color-action-disabled'          },
    ],
  },
  {
    name: 'Focus',
    tokens: [
      { label: 'ring',        var: '--pxd-color-focus-ring'        },
      { label: 'ring-offset', var: '--pxd-color-focus-ring-offset' },
    ],
  },
  {
    name: 'Brand',
    tokens: [
      { label: 'primary',     var: '--pxd-color-brand-primary'     },
      { label: 'secondary',   var: '--pxd-color-brand-secondary'   },
      { label: 'reward',      var: '--pxd-color-brand-reward'      },
      { label: 'epic',        var: '--pxd-color-brand-epic'        },
      { label: 'freeze',      var: '--pxd-color-brand-freeze'      },
      { label: 'smash',       var: '--pxd-color-brand-smash'       },
      { label: 'pixel-ink',   var: '--pxd-color-brand-pixel-ink'   },
      { label: 'pixel-paper', var: '--pxd-color-brand-pixel-paper' },
    ],
  },
  {
    name: 'Rarity',
    tokens: [
      { label: 'common',    var: '--pxd-color-rarity-common'    },
      { label: 'rare',      var: '--pxd-color-rarity-rare'      },
      { label: 'epic',      var: '--pxd-color-rarity-epic'      },
      { label: 'legendary', var: '--pxd-color-rarity-legendary' },
    ],
  },
];

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

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--pxd-color-border-outline-variant)',
  margin: '32px 0',
};

// ─── Swatch component ─────────────────────────────────────────────────────────

function Swatch({ cssVar, label }: { cssVar: string; label: string }) {
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
    </div>
  );
}

// ─── Semantic row component ───────────────────────────────────────────────────

function SemanticToken({ cssVar, label }: { cssVar: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
      <div style={{
        width: '32px',
        height: '32px',
        flexShrink: 0,
        background: `var(${cssVar})`,
        borderRadius: '4px',
        border: '1px solid var(--pxd-color-border-outline-variant)',
      }} />
      <code style={{
        fontFamily: 'var(--pxd-font-mono)',
        fontSize: '12px',
        color: 'var(--pxd-color-text-secondary)',
        flex: 1,
      }}>
        {cssVar}
      </code>
      <span style={{
        fontFamily: 'var(--pxd-font-body)',
        fontSize: '12px',
        color: 'var(--pxd-color-text-tertiary)',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Scale strip ─────────────────────────────────────────────────────────────

function ColorScale({ name, swatches }: { name: string; swatches: { step: string; var: string }[] }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={sectionTitle}>{name}</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {swatches.map(s => (
          <Swatch key={s.var} cssVar={s.var} label={s.step} />
        ))}
      </div>
    </div>
  );
}

// ─── Main story component ─────────────────────────────────────────────────────

function ColorTokens() {
  return (
    <div style={{
      padding: '0',
      fontFamily: 'var(--pxd-font-body)',
      color: 'var(--pxd-color-text-primary)',
      maxWidth: '900px',
    }}>

      {/* ── Primitive ── */}
      <h2 style={h2Style}>Primitive Tokens</h2>
      <p style={{ fontSize: '13px', color: 'var(--pxd-color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        Raw color palette. Theme-neutral. Semantic tokens reference these via{' '}
        <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: '12px' }}>var()</code>.
        Custom themes override primitives to cascade changes automatically.
      </p>

      <ColorScale name="Gray  (light neutral — light mode surfaces & text)" swatches={GRAY_SCALE} />
      <ColorScale name="Ink  (cool blue-gray — dark mode surfaces & text)" swatches={INK_SCALE} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px', marginTop: '8px' }}>
        {COLOR_PALETTES.map(p => (
          <ColorScale key={p.name} name={p.name} swatches={p.swatches} />
        ))}
      </div>

      <hr style={divider} />

      {/* ── Semantic ── */}
      <h2 style={h2Style}>Semantic Tokens</h2>
      <p style={{ fontSize: '13px', color: 'var(--pxd-color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
        UI-role assignments. Toggle <strong>Color Mode</strong> in the toolbar to verify light ↔ dark mapping.
        Component styles must only reference semantic tokens, never primitives directly.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
        {SEMANTIC_GROUPS.map(group => (
          <div key={group.name}>
            <p style={sectionTitle}>{group.name}</p>
            <div style={{
              background: 'var(--pxd-color-surface-raised)',
              border: '1px solid var(--pxd-color-border-outline-variant)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}>
              {group.tokens.map(t => (
                <SemanticToken key={t.var} cssVar={t.var} label={t.label} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Story definition ─────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'Design System/Color Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Color token reference. **Primitive** tokens define the raw palette. **Semantic** tokens map UI roles to primitives — use the **Color Mode** toolbar to verify light ↔ dark. Custom themes override primitives; semantics cascade automatically.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const All: Story = {
  name: 'All tokens',
  render: () => <ColorTokens />,
};
