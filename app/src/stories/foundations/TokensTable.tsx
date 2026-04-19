import React from 'react';

export type PreviewType = 'color' | 'spacing' | 'shadow' | 'none';

export interface TokenRow {
  token: string;
  lightValue?: string | number;
  /** Alias for `lightValue` (MDX convenience). */
  value?: string | number;
  darkValue?: string | number;
  description?: string;
  preview?: PreviewType;
}

interface TokensTableProps {
  rows: TokenRow[];
  caption?: string;
  /** hex → CSS primitive var name (e.g. "#F7F7F8" → "--pd-gray-50") */
  primitiveMap?: Record<string, string>;
}

function ColorSwatch({ value }: { value: string | number }) {
  const str = String(value);
  const isLight =
    str === '#FFFFFF' ||
    str === '#F7F7F8' ||
    str === '#EFEFF1' ||
    str === '#F3F1FF' ||
    str === '#E6E1FF' ||
    str.startsWith('rgba(255') ||
    str.startsWith('rgb(255');
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: str,
        border: `1px solid ${isLight ? '#DDDEE3' : 'transparent'}`,
        flexShrink: 0,
        display: 'inline-block',
      }}
      title={str}
    />
  );
}

function SpacingBar({ value }: { value: number }) {
  const px = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
  return (
    <div
      style={{
        height: 16,
        width: Math.min(px, 120),
        backgroundColor: 'var(--pd-color-text-primary, #191D24)',
        borderRadius: 2,
      }}
      title={`${px}px`}
    />
  );
}

function ShadowBox({ value }: { value: string }) {
  return (
    <div
      style={{
        width: 48,
        height: 32,
        borderRadius: 4,
        backgroundColor: 'var(--pd-color-surface-primary, #FFFFFF)',
        boxShadow: value === 'none' ? undefined : value,
        border: '1px solid var(--pd-color-border-outline-variant, #EFEFF1)',
      }}
      title={value}
    />
  );
}

function rowLight(row: TokenRow): string | number {
  if (row.lightValue !== undefined) return row.lightValue;
  if (row.value !== undefined) return row.value;
  return '';
}

export function TokensTable({ rows, caption, primitiveMap }: TokensTableProps) {
  const hasDark = rows.some(r => r.darkValue !== undefined);

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
          <caption style={{ textAlign: 'left', padding: '0 0 8px 0', fontSize: 13, color: 'var(--pd-color-text-tertiary, #666C7A)' }}>
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            <th style={th}>Token</th>
            <th style={th}>Light</th>
            {hasDark && <th style={th}>Dark</th>}
            <th style={th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const lv = rowLight(row);
            return (
            <tr key={row.token + i}>
              {/* Token name */}
              <td style={td}>
                <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: 'var(--pd-color-text-accent, #5B43D6)' }}>
                  {row.token}
                </code>
              </td>

              {/* Light value */}
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {row.preview === 'color' && <ColorSwatch value={lv} />}
                  {row.preview === 'spacing' && <SpacingBar value={typeof lv === 'number' ? lv : parseInt(String(lv), 10) || 0} />}
                  {row.preview === 'shadow' && <ShadowBox value={String(lv)} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--pd-color-text-secondary, #4C5160)' }}>
                      {String(lv)}
                    </code>
                    {primitiveMap?.[String(lv)] && (
                      <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--pd-color-text-tertiary, #666C7A)', opacity: 0.8 }}>
                        {primitiveMap[String(lv)]}
                      </code>
                    )}
                  </div>
                </div>
              </td>

              {/* Dark value */}
              {hasDark && (
                <td style={td}>
                  {row.darkValue !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {row.preview === 'color' && <ColorSwatch value={row.darkValue} />}
                      {row.preview === 'shadow' && <ShadowBox value={String(row.darkValue)} />}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: 'var(--pd-color-text-secondary, #4C5160)' }}>
                          {String(row.darkValue)}
                        </code>
                        {primitiveMap?.[String(row.darkValue)] && (
                          <code style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: 'var(--pd-color-text-tertiary, #666C7A)', opacity: 0.8 }}>
                            {primitiveMap[String(row.darkValue)]}
                          </code>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--pd-color-text-disabled)', fontSize: 12 }}>—</span>
                  )}
                </td>
              )}

              {/* Description */}
              <td style={{ ...td, color: 'var(--pd-color-text-tertiary, #666C7A)', fontSize: 13, maxWidth: 280 }}>
                {row.description ?? '—'}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
