import React, { useContext, useMemo } from 'react';
import { ThemeContext, getThemePrimitiveInventory, themes } from '../../design-system';
import { useResolvedSemanticColorValues } from './useResolvedCssVars';

function Sw({ value }: { value: string }) {
  const s = String(value);
  const light =
    s === 'rgba(0, 0, 0, 0)' ||
    s.startsWith('rgba(255') ||
    s === 'rgb(255, 255, 255)' ||
    s === '#FFFFFF' ||
    s === '#ffffff';
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 4,
        backgroundColor: s,
        border: `1px solid ${light ? 'var(--pd-color-border-outline-variant)' : 'transparent'}`,
        flexShrink: 0,
      }}
      title={s}
    />
  );
}

function PrimitiveTable({
  title,
  rows,
  resolved,
  emptyHint,
}: {
  title: string;
  rows: { name: string }[];
  resolved: Record<string, string>;
  emptyHint?: string;
}) {
  const th: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '2px solid var(--pd-color-border-outline)',
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--pd-color-text-secondary)',
    background: 'var(--pd-color-surface-page-alt)',
  };
  const td: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid var(--pd-color-border-outline-variant)',
    fontSize: 13,
    color: 'var(--pd-color-text-primary)',
    verticalAlign: 'middle',
  };

  if (rows.length === 0) {
    return (
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--pd-color-text-primary)' }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--pd-color-text-tertiary)' }}>{emptyHint ?? 'なし'}</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--pd-color-text-primary)' }}>{title}</h3>
      <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--pd-color-border-outline-variant)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--pd-font-body)' }}>
          <thead>
            <tr>
              <th style={th}>Token</th>
              <th style={th}>Resolved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const res = resolved[r.name] ?? '';
              return (
                <tr key={r.name}>
                  <td style={td}>
                    <code style={{ fontFamily: 'var(--pd-font-mono)', fontSize: 11, wordBreak: 'break-all' }}>{r.name}</code>
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sw value={res || 'transparent'} />
                      <code style={{ fontFamily: 'var(--pd-font-mono)', fontSize: 11 }}>{res || '—'}</code>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Shows which primitive tokens the active visual theme defines vs references from the global catalog. */
export function ThemePrimitiveTokensPanel() {
  const { theme, visualTheme } = useContext(ThemeContext);
  const vt = themes[visualTheme];
  const inventory = useMemo(() => getThemePrimitiveInventory(visualTheme, theme), [visualTheme, theme]);

  const allVars = useMemo(() => {
    const set = new Set<string>();
    for (const p of inventory.themeDefinedPrimitives) set.add(p.name);
    for (const n of inventory.referencedGlobalPrimitives) set.add(n);
    return [...set];
  }, [inventory]);

  const resolved = useResolvedSemanticColorValues(allVars);

  const themeRows = inventory.themeDefinedPrimitives.map(p => ({ name: p.name }));

  const globalRows = inventory.referencedGlobalPrimitives.map(name => ({ name }));

  return (
    <div style={{ fontFamily: 'var(--pd-font-body)', marginTop: 8, marginBottom: 32 }}>
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid var(--pd-color-border-outline-variant)',
          background: 'var(--pd-color-surface-raised)',
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--pd-color-text-primary)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--pd-color-text-secondary)' }}>
          {vt.icon} {vt.name}（{inventory.mode === 'dark' ? 'Dark' : 'Light'}）
        </strong>
        {' — '}
        {inventory.usesDefaultPaletteAsBase
          ? 'Arcade は tokens.css のデフォルト・セマンティックをベースにし、テーマTS内で上書きするのは主にエフェクト粒子の色です。下の「グローバル・プリミティブ」はそのまま参照される共有パレット一式です。'
          : 'このテーマ専用のプリミティブ（--pd-sw-* / --pd-fb-* など）と、セマンティック層から参照しているグローバル・プリミティブ（--pd-gray-* / --pd-lavender-* など）を分けて表示します。ツールバーで Color Mode / Visual Theme を切り替えると一覧が変わります。'}
      </div>

      <PrimitiveTable
        title="テーマ専用プリミティブ（テーマTSで直接色が定義されているトークン）"
        rows={themeRows}
        resolved={resolved}
        emptyHint="このモードではテーマTSに hex 直指定のプリミティブがありません。"
      />

      <PrimitiveTable
        title={
          inventory.usesDefaultPaletteAsBase
            ? 'グローバル・プリミティブ（共有カタログ — Arcade はデフォルト一式を使用）'
            : '参照しているグローバル・プリミティブ（var() で参照する共有トークン）'
        }
        rows={globalRows}
        resolved={resolved}
        emptyHint="参照なし"
      />
    </div>
  );
}
