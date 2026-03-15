import React from 'react';
import { sound, soundKeys } from '../../design-system';
import { playSound } from '../../services/sound';
import { Button } from '../../design-system';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--pd-font-body)',
  fontSize: '0.875rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid var(--pd-color-border-default)',
  background: 'var(--pd-color-background-elevated)',
  fontWeight: 600,
  color: 'var(--pd-color-text-primary)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--pd-color-border-default)',
  color: 'var(--pd-color-text-primary)',
  verticalAlign: 'middle',
};

const playCellStyle: React.CSSProperties = {
  width: '100px',
  textAlign: 'center',
};

export function SoundTable() {
  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>トークン</th>
          <th style={thStyle}>役割</th>
          <th style={thStyle}>鳴らすタイミング</th>
          <th style={thStyle}>説明</th>
          <th style={{ ...thStyle, ...playCellStyle }}>再生</th>
        </tr>
      </thead>
      <tbody>
        {soundKeys.map((key) => {
          const token = sound[key];
          return (
            <tr key={key}>
              <td style={tdStyle}>
                <code style={{ fontFamily: 'var(--pd-font-brand)', fontSize: '0.8125rem' }}>{token.key}</code>
              </td>
              <td style={tdStyle}>{token.role}</td>
              <td style={tdStyle}>{token.when}</td>
              <td style={tdStyle}>{token.description}</td>
              <td style={{ ...tdStyle, ...playCellStyle }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => playSound(key)}
                  aria-label={`${token.key} を再生`}
                >
                  ▶
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
