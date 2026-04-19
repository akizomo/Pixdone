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
      { token: '--pd-color-surface-page', description: 'Page background' },
      { token: '--pd-color-surface-page-alt', description: 'Alternate page / stripes' },
      { token: '--pd-color-surface-primary', description: 'Primary surface (cards, panels)' },
      { token: '--pd-color-surface-secondary', description: 'Secondary surface' },
      { token: '--pd-color-surface-raised', description: 'Raised / dropdown' },
      { token: '--pd-color-surface-overlay', description: 'Modal backdrop' },
      { token: '--pd-color-surface-inverse', description: 'Inverse surface' },
      { token: '--pd-color-surface-disabled', description: 'Disabled control surface' },
    ],
  },
  {
    id: 'text',
    heading: 'Text',
    caption: 'Text hierarchy and semantic emphasis.',
    rows: [
      { token: '--pd-color-text-primary', description: 'Body and headings' },
      { token: '--pd-color-text-secondary', description: 'Secondary text' },
      { token: '--pd-color-text-tertiary', description: 'Tertiary / muted' },
      { token: '--pd-color-text-inverse', description: 'On inverse backgrounds' },
      { token: '--pd-color-text-disabled', description: 'Disabled text' },
      { token: '--pd-color-text-accent', description: 'Links, accent' },
      { token: '--pd-color-text-success', description: 'Success state' },
      { token: '--pd-color-text-warning', description: 'Warning state' },
      { token: '--pd-color-text-danger', description: 'Error / danger' },
    ],
  },
  {
    id: 'border',
    heading: 'Border',
    caption: 'Border colors for structure, focus, and danger states.',
    rows: [
      { token: '--pd-color-border-outline-variant', description: 'Subtle dividers, card edges' },
      { token: '--pd-color-border-outline', description: 'Structural containers, modals' },
      { token: '--pd-color-border-interactive', description: 'Input / button rest state' },
      { token: '--pd-color-border-interactive-active', description: 'Input / button hover & active state' },
      { token: '--pd-color-border-focus', description: 'Focus ring' },
      { token: '--pd-color-border-danger', description: 'Error border' },
      { token: '--pd-color-border-inverse', description: 'Inverse border' },
    ],
  },
  {
    id: 'feedback',
    heading: 'Feedback',
    caption: 'Status colors for info, success, warning, and danger.',
    rows: [
      { token: '--pd-color-feedback-info', description: 'Info' },
      { token: '--pd-color-feedback-success', description: 'Success' },
      { token: '--pd-color-feedback-warning', description: 'Warning' },
      { token: '--pd-color-feedback-danger', description: 'Danger' },
    ],
  },
  {
    id: 'action',
    heading: 'Action',
    caption: 'Interactive element colors for primary, secondary, and ghost actions.',
    rows: [
      { token: '--pd-color-action-primary', description: 'Primary button' },
      { token: '--pd-color-action-primary-hover', description: 'Primary hover' },
      { token: '--pd-color-action-primary-pressed', description: 'Primary pressed' },
      { token: '--pd-color-action-secondary', description: 'Secondary button' },
      { token: '--pd-color-action-secondary-hover', description: 'Secondary hover' },
      { token: '--pd-color-action-secondary-pressed', description: 'Secondary pressed' },
      { token: '--pd-color-action-ghost-hover', description: 'Ghost hover' },
      { token: '--pd-color-action-ghost-pressed', description: 'Ghost pressed' },
      { token: '--pd-color-action-disabled', description: 'Disabled' },
    ],
  },
  {
    id: 'focus',
    heading: 'Focus',
    caption: 'Focus ring and offset colors.',
    rows: [
      { token: '--pd-color-focus-ring', description: 'Focus ring' },
      { token: '--pd-color-focus-ring-offset', description: 'Focus ring offset' },
    ],
  },
  {
    id: 'brand',
    heading: 'Brand (mode-invariant)',
    caption: 'Identity and rarity colors. Typically stable across light/dark; visual themes may still tune related primitives.',
    rows: [
      { token: '--pd-color-brand-primary', description: 'Brand primary (purple)' },
      { token: '--pd-color-brand-secondary', description: 'Brand secondary (yellow)' },
      { token: '--pd-color-brand-reward', description: 'Reward (green)' },
      { token: '--pd-color-brand-epic', description: 'Epic (pink)' },
      { token: '--pd-color-brand-freeze', description: 'Freeze (cyan)' },
      { token: '--pd-color-brand-smash', description: 'Smash feedback (coral)' },
      { token: '--pd-color-rarity-common', description: 'Rarity: common (gray)' },
      { token: '--pd-color-rarity-rare', description: 'Rarity: rare (blue)' },
      { token: '--pd-color-rarity-epic', description: 'Rarity: epic (pink)' },
      { token: '--pd-color-rarity-legendary', description: 'Rarity: legendary (gold)' },
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
        border: `1px solid ${isLight ? 'var(--pd-color-border-outline, #DDDEE3)' : 'transparent'}`,
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
    borderBottom: '2px solid var(--pd-color-border-outline, #DDDEE3)',
    fontWeight: 600,
    fontSize: 13,
    color: 'var(--pd-color-text-secondary, #4C5160)',
    background: 'var(--pd-color-surface-page-alt, #F7F7F8)',
    whiteSpace: 'nowrap',
  };

  const td: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid var(--pd-color-border-outline-variant, #EFEFF1)',
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
              color: 'var(--pd-color-text-tertiary, #666C7A)',
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
                      fontFamily: 'var(--pd-font-mono), "JetBrains Mono", monospace',
                      fontSize: 12,
                      color: 'var(--pd-color-text-accent, #5B43D6)',
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
                          fontFamily: 'var(--pd-font-mono), "JetBrains Mono", monospace',
                          fontSize: 11,
                          color: 'var(--pd-color-text-secondary, #4C5160)',
                        }}
                      >
                        {val || '—'}
                      </code>
                      {prim && (
                        <code
                          style={{
                            fontFamily: 'var(--pd-font-mono), "JetBrains Mono", monospace',
                            fontSize: 10,
                            color: 'var(--pd-color-text-tertiary, #666C7A)',
                            opacity: 0.85,
                          }}
                        >
                          {prim}
                        </code>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ ...td, color: 'var(--pd-color-text-tertiary, #666C7A)', fontSize: 13, maxWidth: 280 }}>
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
    <div style={{ fontFamily: 'var(--pd-font-body)' }}>
      {SECTIONS.map(section => (
        <section key={section.id}>
          <h2
            style={{
              fontFamily: 'var(--pd-font-body)',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--pd-color-text-primary)',
              marginBottom: 8,
              marginTop: 28,
              borderBottom: '1px solid var(--pd-color-border-outline-variant)',
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
