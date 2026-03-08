import React from 'react';

export type PreviewType = 'color' | 'spacing' | 'shadow' | 'none';

export interface TokenRow {
  token: string;
  value: string | number;
  description?: string;
  preview?: PreviewType;
}

interface TokensTableProps {
  rows: TokenRow[];
  caption?: string;
}

const tableStyles: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  fontFamily: 'inherit',
};

const thStyles: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 16px',
  borderBottom: '2px solid #DDDEE3',
  fontWeight: 600,
  color: '#191D24',
  backgroundColor: '#F7F7F8',
};

const tdStyles: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #EFEFF1',
  color: '#191D24',
  verticalAlign: 'middle',
};

const tokenCellStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 13,
  color: '#5B43D6',
};

const valueCellStyle: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: 12,
  color: '#4C5160',
};

const descCellStyle: React.CSSProperties = {
  color: '#666C7A',
  fontSize: 13,
  maxWidth: 320,
};

function ColorPreview({ value }: { value: string }) {
  const isLight =
    value === '#FFFFFF' ||
    value === '#F7F7F8' ||
    value === '#EFEFF1' ||
    value === '#F3F1FF' ||
    value === '#E6E1FF' ||
    value.startsWith('rgba(255') ||
    value.startsWith('rgb(255');
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 4,
        backgroundColor: value,
        border: isLight ? '1px solid #DDDEE3' : 'none',
        flexShrink: 0,
      }}
      title={String(value)}
    />
  );
}

function SpacingPreview({ value }: { value: number }) {
  const px = typeof value === 'number' ? value : parseInt(String(value), 10) || 0;
  return (
    <div
      style={{
        height: 16,
        width: Math.min(px, 120),
        maxWidth: '100%',
        backgroundColor: '#191D24',
        borderRadius: 2,
        flexShrink: 0,
      }}
      title={`${px}px`}
    />
  );
}

function ShadowPreview({ value }: { value: string }) {
  if (value === 'none') {
    return (
      <div
        style={{
          width: 48,
          height: 32,
          borderRadius: 4,
          backgroundColor: '#FFFFFF',
          border: '1px solid #EFEFF1',
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 48,
        height: 32,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        boxShadow: value,
        border: '1px solid #EFEFF1',
      }}
      title={value}
    />
  );
}

function PreviewCell({ row }: { row: TokenRow }) {
  const { preview, value } = row;
  if (!preview || preview === 'none') return <span style={{ color: '#A6AAB6', fontSize: 12 }}>—</span>;
  if (preview === 'color') return <ColorPreview value={String(value)} />;
  if (preview === 'spacing') {
    const num = typeof value === 'number' ? value : parseInt(String(value).replace(/px/g, ''), 10) || 0;
    return <SpacingPreview value={num} />;
  }
  if (preview === 'shadow') return <ShadowPreview value={String(value)} />;
  return null;
}

export function TokensTable({ rows, caption }: TokensTableProps) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 8, marginBottom: 24 }}>
      <table style={tableStyles}>
        {caption && (
          <caption style={{ textAlign: 'left', padding: '0 0 8px 0', fontSize: 13, color: '#666C7A' }}>
            {caption}
          </caption>
        )}
        <thead>
          <tr>
            <th style={thStyles}>Token</th>
            <th style={thStyles}>Value</th>
            <th style={thStyles}>Preview</th>
            <th style={thStyles}>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.token + i}>
              <td style={tdStyles}>
                <code style={tokenCellStyle}>{row.token}</code>
              </td>
              <td style={tdStyles}>
                <code style={valueCellStyle}>
                  {typeof row.value === 'number' ? `${row.value}` : row.value}
                  {row.preview === 'spacing' && typeof row.value === 'number' ? 'px' : ''}
                </code>
              </td>
              <td style={tdStyles}>
                <PreviewCell row={row} />
              </td>
              <td style={{ ...tdStyles, ...descCellStyle }}>{row.description ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
