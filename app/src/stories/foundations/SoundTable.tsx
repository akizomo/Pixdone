import React, { useContext } from 'react';
import { sound, soundKeys, ThemeContext } from '../../design-system';
import { themes } from '../../design-system/themes/themeRegistry';
import { playSound } from '../../services/sound';
import { Button } from '../../design-system';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--pxd-font-body)',
  fontSize: '0.875rem',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  borderBottom: '2px solid var(--pxd-color-border-outline)',
  background: 'var(--pxd-color-surface-page-alt)',
  fontWeight: 600,
  color: 'var(--pxd-color-text-secondary)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--pxd-color-border-outline-variant)',
  color: 'var(--pxd-color-text-primary)',
  verticalAlign: 'middle',
};

const playCellStyle: React.CSSProperties = {
  width: '100px',
  textAlign: 'center',
};

export function SoundTable() {
  const { visualTheme } = useContext(ThemeContext);
  const vt = themes[visualTheme];

  return (
    <div>
      <div
        style={{
          marginBottom: 12,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--pxd-color-border-outline-variant)',
          background: 'var(--pxd-color-surface-raised)',
          fontFamily: 'var(--pxd-font-body)',
          fontSize: 13,
          color: 'var(--pxd-color-text-primary)',
        }}
      >
        <strong style={{ color: 'var(--pxd-color-text-secondary)' }}>現在のビジュアルテーマ:</strong>{' '}
        {vt.icon} {vt.name} — サウンドパック <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>{vt.soundPackKey}</code>
        （<code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>ThemeProvider</code> → エンジンで音色が切り替わります）
      </div>
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
                  <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: '0.8125rem' }}>{token.key}</code>
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
    </div>
  );
}
