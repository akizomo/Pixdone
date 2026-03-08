import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Design System/Grid & Spacing',
  parameters: {
    docs: {
      description: {
        component:
          '12-column grid system with 8px base unit. All spacing values are multiples of 4px. Never use arbitrary spacing — always reference a spacing token.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const s = {
  page: { fontFamily: 'var(--pxd-font-body)', color: 'var(--pxd-color-text-primary)', maxWidth: 900 } as React.CSSProperties,
  h1: { fontFamily: 'var(--pxd-font-display)', fontSize: 18, letterSpacing: '0.04em', color: 'var(--pxd-color-brand-primary)', marginBottom: 8 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, marginTop: 36 } as React.CSSProperties,
  lead: { fontSize: 14, color: 'var(--pxd-color-text-secondary)', lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
};

export const SpacingScale: Story = {
  name: '1. Spacing Scale',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Spacing Scale</h1>
      <p style={s.lead}>Based on a 4px grid. Every spacing decision maps to one of these steps.</p>

      <div style={{ marginBottom: 32 }}>
        {[
          { step: '0', px: 0, token: '--pxd-space-0', use: 'Collapse / reset' },
          { step: '1', px: 4, token: '--pxd-space-1', use: 'Icon gap, inline badge offset' },
          { step: '2', px: 8, token: '--pxd-space-2', use: 'Tight component inner padding, chip gap' },
          { step: '3', px: 12, token: '--pxd-space-3', use: 'Button padding (sm), input inner padding' },
          { step: '4', px: 16, token: '--pxd-space-4', use: 'Button padding (md), card inner padding, grid gutter' },
          { step: '5', px: 20, token: '--pxd-space-5', use: 'Card padding, list item padding' },
          { step: '6', px: 24, token: '--pxd-space-6', use: 'Section gap, panel padding, dialog padding' },
          { step: '8', px: 32, token: '--pxd-space-8', use: 'Large section gap, between groups' },
          { step: '10', px: 40, token: '--pxd-space-10', use: 'Page section margin, hero spacing' },
          { step: '12', px: 48, token: '--pxd-space-12', use: 'Full-bleed section spacing' },
          { step: '14', px: 56, token: '--pxd-space-14', use: 'Navigation bar height reference' },
          { step: '16', px: 64, token: '--pxd-space-16', use: 'Hero gap, page-level spacing' },
        ].map(({ step, px, token, use }) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--pxd-color-border-subtle)', paddingTop: 10, paddingBottom: 10 }}>
            <div style={{ width: 32, fontFamily: 'var(--pxd-font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--pxd-color-text-secondary)' }}>{step}</div>
            <div style={{ width: px || 1, minWidth: px > 0 ? px : 1, height: 20, background: 'var(--pxd-color-brand-primary)', borderRadius: 2, flexShrink: 0 }} />
            <div style={{ width: 48, fontFamily: 'var(--pxd-font-mono)', fontSize: 12, color: 'var(--pxd-color-text-tertiary)' }}>{px}px</div>
            <div style={{ flex: 1, fontFamily: 'var(--pxd-font-mono)', fontSize: 11, color: 'var(--pxd-color-text-accent)' }}>{token}</div>
            <div style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)', textAlign: 'right' as const, maxWidth: 240 }}>{use}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const GridSystem: Story = {
  name: '2. 12-Column Grid',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>12-Column Grid</h1>
      <p style={s.lead}>Responsive 12-column grid. Columns collapse gracefully from desktop to mobile.</p>

      <h2 style={s.h2}>Grid Specs</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
        {[
          { label: 'Columns', value: '12' },
          { label: 'Gutter (≥768px)', value: '16px' },
          { label: 'Gutter (<768px)', value: '12px' },
          { label: 'Page Margin (≥768px)', value: '24px' },
          { label: 'Page Margin (<768px)', value: '16px' },
          { label: 'Base Unit', value: '8px' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--pxd-color-surface-secondary)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--pxd-color-brand-primary)', fontFamily: 'var(--pxd-font-display)', fontSize: 16 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Column Visualization</h2>
      <div style={{ background: 'var(--pxd-color-surface-secondary)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 8 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ background: 'rgba(123,97,255,0.15)', border: '1px solid rgba(123,97,255,0.4)', borderRadius: 4, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--pxd-color-brand-primary)', fontWeight: 700 }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      <h2 style={s.h2}>Common Layouts</h2>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
        {[
          { label: 'Full width', cols: [12], note: '1 col = 12/12' },
          { label: 'Halves', cols: [6, 6], note: '2 × 6/12' },
          { label: 'Thirds', cols: [4, 4, 4], note: '3 × 4/12' },
          { label: 'Quarters', cols: [3, 3, 3, 3], note: '4 × 3/12' },
          { label: 'Sidebar + Content', cols: [3, 9], note: 'Sidebar 3/12, Content 9/12' },
          { label: 'Content + Sidebar', cols: [8, 4], note: 'Content 8/12, Sidebar 4/12' },
          { label: 'Split + Detail', cols: [5, 7], note: 'List 5/12, Detail 7/12' },
        ].map(({ label, cols, note }) => (
          <div key={label}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--pxd-color-text-secondary)' }}>{label} <span style={{ fontWeight: 400, color: 'var(--pxd-color-text-tertiary)' }}>— {note}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4 }}>
              {cols.map((span, i) => (
                <div key={i} style={{ gridColumn: `span ${span}`, background: 'var(--pxd-color-brand-primary)', opacity: 0.7 + i * 0.15, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                  {span} col
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Breakpoints</h2>
      <div style={{ overflowX: 'auto' as const, marginBottom: 32 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--pxd-color-surface-secondary)' }}>
              {['Name', 'Min Width', 'Token', 'Columns', 'Gutter', 'Margin'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, borderBottom: '2px solid var(--pxd-color-border-subtle)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Mobile', '0', '—', '4', '12px', '16px'],
              ['SM', '480px', 'layout.breakpoint.sm', '8', '12px', '16px'],
              ['MD (Tablet)', '768px', 'layout.breakpoint.md', '12', '16px', '24px'],
              ['LG (Desktop)', '1024px', 'layout.breakpoint.lg', '12', '16px', '24px'],
              ['XL', '1280px', 'layout.breakpoint.xl', '12', '24px', '32px'],
              ['2XL', '1440px', 'layout.breakpoint.2xl', '12', '24px', '40px'],
            ].map((row, i) => (
              <tr key={row[0]} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--pxd-color-surface-secondary)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid var(--pxd-color-border-subtle)', fontWeight: j === 0 ? 600 : 400, fontFamily: j === 2 ? 'var(--pxd-font-mono)' : 'inherit', fontSize: j === 2 ? 11 : 13 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};

export const SpacingUsage: Story = {
  name: '3. Spacing Usage Guide',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Spacing Usage</h1>
      <p style={s.lead}>When to use which spacing token at each level of the component hierarchy.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { level: 'Within Component', tokens: ['space-1 (4px)', 'space-2 (8px)', 'space-3 (12px)'], example: 'Icon → label gap, checkbox → text gap, chip inner padding', color: 'var(--pxd-color-brand-primary)' },
          { level: 'Component Padding', tokens: ['space-3 (12px)', 'space-4 (16px)', 'space-5 (20px)'], example: 'Button padding, input padding, card inner padding', color: 'var(--pxd-color-feedback-info)' },
          { level: 'Between Components', tokens: ['space-4 (16px)', 'space-6 (24px)'], example: 'Form field gap, button group gap, list item spacing', color: 'var(--pxd-color-brand-secondary)' },
          { level: 'Section / Panel', tokens: ['space-6 (24px)', 'space-8 (32px)', 'space-10 (40px)'], example: 'Card margin, section heading gap, dialog content spacing', color: 'var(--pxd-color-feedback-success)' },
          { level: 'Page Layout', tokens: ['space-8 (32px)', 'space-10 (40px)', 'space-12 (48px)', 'space-16 (64px)'], example: 'Page section gap, hero margin, footer spacing', color: 'var(--pxd-color-brand-epic)' },
          { level: 'Z-Axis (Z-Index)', tokens: ['base:0', 'dropdown:100', 'overlay:300', 'modal:500', 'toast:600', 'tooltip:700'], example: 'Always use the z-index tokens — never arbitrary values', color: 'var(--pxd-color-feedback-warning)' },
        ].map(({ level, tokens, example, color }) => (
          <div key={level} style={{ background: 'var(--pxd-color-surface-primary)', border: `2px solid ${color}`, borderRadius: 8, padding: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color }}>{level}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
              {tokens.map(t => (
                <code key={t} style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 11, background: 'var(--pxd-color-surface-secondary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 4, padding: '2px 6px' }}>{t}</code>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)', margin: 0 }}>{example}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};
