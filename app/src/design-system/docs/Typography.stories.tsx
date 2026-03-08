import type { Meta, StoryObj } from '@storybook/react-vite';
import { typography } from '../foundations/typography.tokens';

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: {
    docs: {
      description: {
        component:
          '9-level type scale with two font families. **Inter** for all product copy; **Press Start 2P** for brand/pixel moments only. All text styles reference design tokens — never hardcode font values.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const s = {
  page: { fontFamily: 'var(--pxd-font-body)', color: 'var(--pxd-color-text-primary)', maxWidth: 860 } as React.CSSProperties,
  h1: { fontFamily: 'var(--pxd-font-display)', fontSize: 20, letterSpacing: '0.04em', color: 'var(--pxd-color-brand-primary)', marginBottom: 8 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, marginTop: 36 } as React.CSSProperties,
  lead: { fontSize: 14, color: 'var(--pxd-color-text-secondary)', lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
  divider: { borderTop: '1px solid var(--pxd-color-border-subtle)', margin: '24px 0' } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 600, color: 'var(--pxd-color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' as const } as React.CSSProperties,
};

const TEXT_STYLES = [
  { name: 'Display LG', key: 'displayLg', sample: 'PIXDONE', use: 'Hero logo, score display, celebration screen', font: 'pixel' },
  { name: 'Display MD', key: 'displayMd', sample: 'LEVEL UP!', use: 'Section headers in game UI, milestones', font: 'pixel' },
  { name: 'Heading LG', key: 'headingLg', sample: 'Today\'s Tasks', use: 'Page titles, panel headers', font: 'body' },
  { name: 'Heading MD', key: 'headingMd', sample: 'Work Projects', use: 'Section titles, list group headers', font: 'body' },
  { name: 'Heading SM', key: 'headingSm', sample: 'Priority Items', use: 'Card titles, sidebar sections', font: 'body' },
  { name: 'Body MD', key: 'bodyMd', sample: 'Complete your daily tasks to level up your character and earn rewards.', use: 'Primary body copy, descriptions', font: 'body' },
  { name: 'Body SM', key: 'bodySm', sample: 'Mark all tasks complete to unlock the daily streak bonus.', use: 'Secondary body copy, tooltips, helper text', font: 'body' },
  { name: 'Label MD', key: 'labelMd', sample: 'Save Changes', use: 'Button labels, form labels, navigation items', font: 'body' },
  { name: 'Label SM', key: 'labelSm', sample: 'Required field', use: 'Captions, timestamps, metadata, tags', font: 'body' },
  { name: 'Pixel Label', key: 'pixelLabel', sample: 'XP +120', use: 'Scores, counters, game mechanics', font: 'pixel' },
];

export const TypeScale: Story = {
  name: '1. Type Scale',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Type Scale</h1>
      <p style={s.lead}>10 text styles covering every UI layer. Use the pixel family sparingly — it creates emphasis through rarity.</p>
      <div>
        {TEXT_STYLES.map(({ name, key, sample, use, font }) => {
          const ts = typography.textStyle[key as keyof typeof typography.textStyle];
          return (
            <div key={key} style={{ borderTop: '1px solid var(--pxd-color-border-subtle)', paddingTop: 20, paddingBottom: 20, display: 'grid', gridTemplateColumns: '180px 1fr 180px', gap: 24, alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{name}</div>
                <div style={s.label}>{font === 'pixel' ? 'Pixel / Display' : 'Inter / Body'}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--pxd-color-text-tertiary)', lineHeight: 1.6 }}>
                  <div>{ts.fontSize}px / {ts.lineHeight}</div>
                  <div>wt {ts.fontWeight}</div>
                  <div>ls {ts.letterSpacing}</div>
                </div>
              </div>
              <div style={{ fontFamily: ts.fontFamily, fontSize: ts.fontSize, fontWeight: ts.fontWeight, lineHeight: ts.lineHeight, letterSpacing: ts.letterSpacing }}>
                {sample}
              </div>
              <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)', lineHeight: 1.5 }}>{use}</div>
            </div>
          );
        })}
      </div>
    </div>
  ),
};

export const FontFamilies: Story = {
  name: '2. Font Families',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Font Families</h1>
      <p style={s.lead}>Three families — each with a specific purpose. Never mix roles.</p>
      <div style={{ display: 'grid', gap: 24 }}>
        {[
          {
            name: 'Inter (Body)',
            token: '--pxd-font-body',
            stack: '"Inter", "Noto Sans JP", system-ui, sans-serif',
            role: 'All UI copy: labels, body, headings, navigation. The workhorse of the system.',
            sample: 'The quick brown fox jumps over the lazy dog',
            weights: ['Regular 400', 'Medium 500', 'SemiBold 600', 'Bold 700'],
            wValues: [400, 500, 600, 700],
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          {
            name: 'Press Start 2P (Display)',
            token: '--pxd-font-display',
            stack: '"Press Start 2P", "DotGothic16", monospace',
            role: 'Brand moments, scores, level-ups, achievements. Use sparingly — never for body text.',
            sample: 'PIXDONE',
            weights: ['Regular 400 (only weight)'],
            wValues: [400],
            fontFamily: '"Press Start 2P", monospace',
          },
          {
            name: 'JetBrains Mono (Mono)',
            token: '--pxd-font-mono',
            stack: '"JetBrains Mono", monospace',
            role: 'Code snippets, token values, design specs, developer tools.',
            sample: '--pxd-color-brand-primary: #7B61FF',
            weights: ['Regular 400', 'Bold 700'],
            wValues: [400, 700],
            fontFamily: '"JetBrains Mono", monospace',
          },
        ].map(({ name, token, stack, role, sample, weights, wValues, fontFamily }) => (
          <div key={name} style={{ background: 'var(--pxd-color-surface-primary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{name}</div>
                <code style={{ fontSize: 11, color: 'var(--pxd-color-text-accent)', fontFamily: 'var(--pxd-font-mono)' }}>{token}</code>
              </div>
              <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)', textAlign: 'right' as const, maxWidth: 200 }}>{role}</div>
            </div>
            <div style={{ fontFamily, fontSize: 24, marginBottom: 16, color: 'var(--pxd-color-text-primary)' }}>{sample}</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
              {weights.map((w, i) => (
                <span key={w} style={{ fontFamily, fontWeight: wValues[i], fontSize: 14 }}>{w}</span>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--pxd-color-text-tertiary)', fontFamily: 'var(--pxd-font-mono)' }}>{stack}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ResponsiveScale: Story = {
  name: '3. Responsive Scale',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Responsive Scale</h1>
      <p style={s.lead}>Font sizes remain fixed — layouts reflow instead of scaling type down. At narrow breakpoints, choose a smaller text style rather than reducing font-size.</p>
      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--pxd-color-surface-secondary)' }}>
              {['Text Style', '≥1024px (Desktop)', '≥768px (Tablet)', '<768px (Mobile)', 'Never below'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, borderBottom: '2px solid var(--pxd-color-border-subtle)', whiteSpace: 'nowrap' as const }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Display LG', '24px', '20px (displayMd)', '20px (displayMd)', '16px'],
              ['Heading LG', '24px', '20px (headingMd)', '18px (headingSm)', '16px'],
              ['Heading MD', '20px', '18px (headingSm)', '18px (headingSm)', '16px'],
              ['Heading SM', '18px', '18px', '16px (bodyMd bold)', '14px'],
              ['Body MD', '16px', '16px', '16px', '14px'],
              ['Body SM', '14px', '14px', '14px', '12px'],
              ['Label MD', '14px', '14px', '14px', '12px'],
              ['Label SM', '12px', '12px', '12px', '11px'],
            ].map((row, i) => (
              <tr key={row[0]} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--pxd-color-surface-secondary)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '8px 12px', borderBottom: '1px solid var(--pxd-color-border-subtle)', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 32, background: 'var(--pxd-color-surface-secondary)', borderRadius: 8, padding: 20, borderLeft: '4px solid var(--pxd-color-feedback-info)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Accessibility Reminder</div>
        <p style={{ fontSize: 13, color: 'var(--pxd-color-text-secondary)', margin: 0 }}>
          Use relative units in layout but keep font sizes in px for predictability.
          Allow the browser to scale with user zoom. Never set <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>user-scalable=no</code> in the viewport meta.
          Minimum body text: <strong>14px</strong>. Minimum accessible label: <strong>12px</strong>.
        </p>
      </div>
    </div>
  ),
};
