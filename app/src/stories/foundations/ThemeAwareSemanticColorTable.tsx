import React from 'react';
import { primitiveLookup } from '../../design-system';
import { useResolvedSemanticColorValues } from './useResolvedCssVars';

type RowDef = { token: string; description: string };

type SectionDef = { id: string; heading: string; caption: string; rows: RowDef[] };

const SECTIONS: SectionDef[] = [
  {
    id: 'surface',
    heading: 'Surface',
    caption: 'Background layers: page, cards, overlay.',
    rows: [
      { token: '--pxd-color-surface-page', description: 'Page background' },
      { token: '--pxd-color-surface-page-alt', description: 'Alternate page / stripes' },
      { token: '--pxd-color-surface-primary', description: 'Primary surface (cards, panels)' },
      { token: '--pxd-color-surface-secondary', description: 'Secondary surface' },
      { token: '--pxd-color-surface-raised', description: 'Raised / dropdown' },
      { token: '--pxd-color-surface-overlay', description: 'Modal backdrop' },
      { token: '--pxd-color-surface-inverse', description: 'Inverse surface' },
      { token: '--pxd-color-surface-disabled', description: 'Disabled control surface' },
    ],
  },
  {
    id: 'text',
    heading: 'Text',
    caption: 'Text hierarchy and semantic emphasis.',
    rows: [
      { token: '--pxd-color-text-primary', description: 'Body and headings' },
      { token: '--pxd-color-text-secondary', description: 'Secondary text' },
      { token: '--pxd-color-text-tertiary', description: 'Tertiary / muted' },
      { token: '--pxd-color-text-inverse', description: 'On inverse backgrounds' },
      { token: '--pxd-color-text-disabled', description: 'Disabled text' },
      { token: '--pxd-color-text-accent', description: 'Links, accent' },
      { token: '--pxd-color-text-success', description: 'Success state' },
      { token: '--pxd-color-text-warning', description: 'Warning state' },
      { token: '--pxd-color-text-danger', description: 'Error / danger' },
    ],
  },
  {
    id: 'border',
    heading: 'Border',
    caption: 'Border colors for structure, focus, and danger states.',
    rows: [
      { token: '--pxd-color-border-outline-variant', description: 'Subtle dividers, card edges' },
      { token: '--pxd-color-border-outline', description: 'Structural containers, modals' },
      { token: '--pxd-color-border-interactive', description: 'Input / button rest state' },
      { token: '--pxd-color-border-interactive-active', description: 'Input / button hover & active state' },
      { token: '--pxd-color-border-focus', description: 'Focus ring' },
      { token: '--pxd-color-border-danger', description: 'Error border' },
      { token: '--pxd-color-border-inverse', description: 'Inverse border' },
    ],
  },
  {
    id: 'feedback',
    heading: 'Feedback',
    caption: 'Status colors for info, success, warning, and danger.',
    rows: [
      { token: '--pxd-color-feedback-info', description: 'Info' },
      { token: '--pxd-color-feedback-success', description: 'Success' },
      { token: '--pxd-color-feedback-warning', description: 'Warning' },
      { token: '--pxd-color-feedback-danger', description: 'Danger' },
    ],
  },
  {
    id: 'action',
    heading: 'Action',
    caption: 'Interactive element colors for primary, secondary, and ghost actions.',
    rows: [
      { token: '--pxd-color-action-primary', description: 'Primary button' },
      { token: '--pxd-color-action-primary-hover', description: 'Primary hover' },
      { token: '--pxd-color-action-primary-pressed', description: 'Primary pressed' },
      { token: '--pxd-color-action-secondary', description: 'Secondary button' },
      { token: '--pxd-color-action-secondary-hover', description: 'Secondary hover' },
      { token: '--pxd-color-action-secondary-pressed', description: 'Secondary pressed' },
      { token: '--pxd-color-action-ghost-hover', description: 'Ghost hover' },
      { token: '--pxd-color-action-ghost-pressed', description: 'Ghost pressed' },
      { token: '--pxd-color-action-disabled', description: 'Disabled' },
    ],
  },
  {
    id: 'focus',
    heading: 'Focus',
    caption: 'Focus ring and offset colors.',
    rows: [
      { token: '--pxd-color-focus-ring', description: 'Focus ring' },
      { token: '--pxd-color-focus-ring-offset', description: 'Focus ring offset' },
    ],
  },
  {
    id: 'brand',
    heading: 'Brand (mode-invariant)',
    caption: 'Identity and rarity colors. Typically stable across light/dark; visual themes may still tune related primitives.',
    rows: [
      { token: '--pxd-color-brand-primary', description: 'Brand primary (purple)' },
      { token: '--pxd-color-brand-secondary', description: 'Brand secondary (yellow)' },
      { token: '--pxd-color-brand-reward', description: 'Reward (green)' },
      { token: '--pxd-color-brand-epic', description: 'Epic (pink)' },
      { token: '--pxd-color-brand-freeze', description: 'Freeze (cyan)' },
      { token: '--pxd-color-brand-smash', description: 'Smash feedback (coral)' },
      { token: '--pxd-color-rarity-common', description: 'Rarity: common (gray)' },
      { token: '--pxd-color-rarity-rare', description: 'Rarity: rare (blue)' },
      { token: '--pxd-color-rarity-epic', description: 'Rarity: epic (pink)' },
      { token: '--pxd-color-rarity-legendary', description: 'Rarity: legendary (gold)' },
    ],
  },
];

const ALL_TOKENS = SECTIONS.flatMap(s => s.rows.map(r => r.token));

function ColorSwatch({ value }: { value: string }) {
  const str = String(value);
  const isLight =
    str === '#FFFFFF' ||
    str === '#ffffff' ||
    str === 'rgb(255, 255, 255)' ||
    str === 'rgba(0, 0, 0, 0)' ||
    str.startsWith('rgba(255');
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: str,
        border: `1px solid ${isLight ? 'var(--pxd-color-border-outline, #DDDEE3)' : 'transparent'}`,
        flexShrink: 0,
        display: 'inline-block',
      }}
      title={str}
    />
  );
}

function SectionTable({ caption, rows, resolved }: { caption: string; rows: RowDef[]; resolved: Record<string, string> }) {
  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '10px 14px',
    borderBottom: '2px solid var(--pxd-color-border-outline, #DDDEE3)',
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--pxd-color-text-secondary, #4C5160)',
    background: 'var(--pxd-color-surface-page-alt, #F7F7F8)',
    whiteSpace: 'nowrap',
  };

  const td: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid var(--pxd-color-border-outline-variant, #EFEFF1)',
    verticalAlign: 'middle',
  };

  return (
    <div style={{ overflowX: 'auto', marginTop: 8, marginBottom: 24 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: 'inherit' }}>
        {caption && (
          <caption
            style={{
              textAlign: 'left',
              padding: '0 0 8px 0',
              fontSize: 13,
              color: 'var(--pxd-color-text-tertiary, #666C7A)',
            }}
          >
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            <th style={th}>Token</th>
            <th style={th}>Resolved</th>
            <th style={th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const val = resolved[row.token] ?? '';
            const prim = primitiveLookup[val as keyof typeof primitiveLookup];
            return (
              <tr key={row.token}>
                <td style={td}>
                  <code
                    style={{
                      fontFamily: 'var(--pxd-font-mono), "JetBrains Mono", monospace',
                      fontSize: 12,
                      color: 'var(--pxd-color-text-accent, #5B43D6)',
                    }}
                  >
                    {row.token}
                  </code>
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ColorSwatch value={val || 'transparent'} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <code
                        style={{
                          fontFamily: 'var(--pxd-font-mono), "JetBrains Mono", monospace',
                          fontSize: 11,
                          color: 'var(--pxd-color-text-secondary, #4C5160)',
                        }}
                      >
                        {val || '—'}
                      </code>
                      {prim && (
                        <code
                          style={{
                            fontFamily: 'var(--pxd-font-mono), "JetBrains Mono", monospace',
                            fontSize: 10,
                            color: 'var(--pxd-color-text-tertiary, #666C7A)',
                            opacity: 0.85,
                          }}
                        >
                          {prim}
                        </code>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ ...td, color: 'var(--pxd-color-text-tertiary, #666C7A)', fontSize: 13, maxWidth: 280 }}>
                  {row.description}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Semantic color tables: values follow Storybook Color Mode + Visual Theme toolbars. */
export function ThemeAwareSemanticColorTables() {
  const resolved = useResolvedSemanticColorValues(ALL_TOKENS);

  return (
    <div style={{ fontFamily: 'var(--pxd-font-body)' }}>
      {SECTIONS.map(section => (
        <section key={section.id}>
          <h2
            style={{
              fontFamily: 'var(--pxd-font-body)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--pxd-color-text-primary)',
              marginBottom: 8,
              marginTop: 28,
              borderBottom: '1px solid var(--pxd-color-border-outline-variant)',
              paddingBottom: 8,
            }}
          >
            {section.heading}
          </h2>
          <SectionTable caption={section.caption} rows={section.rows} resolved={resolved} />
        </section>
      ))}
    </div>
  );
}
