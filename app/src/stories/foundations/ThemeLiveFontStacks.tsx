import React from 'react';
import { useResolvedCssCustomProperties } from './useResolvedCssVars';

const FONT_VARS = [
  '--pd-font-body',
  '--pd-font-display',
  '--pd-font-mono',
  '--pd-font-body',
  '--pd-font-brand',
  '--pd-font-brand-ja',
] as const;

/** Current font-family stacks from CSS variables (PXD + legacy component tokens themes may override). */
export function ThemeLiveFontStacks() {
  const resolved = useResolvedCssCustomProperties(FONT_VARS);

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
        <caption
          style={{
            textAlign: 'left',
            padding: '0 0 8px 0',
            fontSize: 13,
            color: 'var(--pd-color-text-tertiary, #666C7A)',
          }}
        >
          Resolved `font-family` on `document.documentElement` for the current Storybook toolbars (Color Mode +
          Visual Theme). `--pd-font-*` is the legacy layer some visual themes override (e.g. Synthwave); `--pd-font-*`
          comes from `tokens.css` unless extended later.
        </caption>
        <thead>
          <tr>
            <th style={th}>CSS variable</th>
            <th style={th}>Resolved</th>
            <th style={th}>Sample</th>
          </tr>
        </thead>
        <tbody>
          {FONT_VARS.map(name => (
            <tr key={name}>
              <td style={td}>
                <code
                  style={{
                    fontFamily: 'var(--pd-font-mono), "JetBrains Mono", monospace',
                    fontSize: 12,
                    color: 'var(--pd-color-text-accent, #5B43D6)',
                  }}
                >
                  {name}
                </code>
              </td>
              <td style={{ ...td, color: 'var(--pd-color-text-secondary)', fontSize: 12, maxWidth: 420 }}>
                <code style={{ fontFamily: 'var(--pd-font-mono), monospace', fontSize: 11, wordBreak: 'break-word' }}>
                  {resolved[name] || '—'}
                </code>
              </td>
              <td style={{ ...td, fontFamily: resolved[name] || 'inherit', fontSize: 14, color: 'var(--pd-color-text-primary)' }}>
                Aa あいう 012
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
