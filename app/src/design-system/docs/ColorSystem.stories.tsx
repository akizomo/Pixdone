import type { Meta, StoryObj } from '@storybook/react-vite';
import { color } from '../foundations/color.tokens';

const meta: Meta = {
  title: 'Design System/Color System',
  parameters: {
    docs: {
      description: {
        component:
          'Three-layer color architecture: **Core** (raw primitives) → **Semantic** (UI meaning) → **Brand** (Pixdone identity). Always use semantic or brand tokens in components — never reference core values directly.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const s = {
  page: { fontFamily: 'var(--pxd-font-body)', color: 'var(--pxd-color-text-primary)', maxWidth: 900 } as React.CSSProperties,
  h1: { fontFamily: 'var(--pxd-font-display)', fontSize: 20, letterSpacing: '0.04em', color: 'var(--pxd-color-brand-primary)', marginBottom: 4 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, marginTop: 36 } as React.CSSProperties,
  h3: { fontSize: 13, fontWeight: 600, color: 'var(--pxd-color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 20 } as React.CSSProperties,
  lead: { fontSize: 14, color: 'var(--pxd-color-text-secondary)', lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
  swatchRow: { display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 16 } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 } as React.CSSProperties,
};

function Swatch({ name, value, token, size = 'md' }: { name: string; value: string; token?: string; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'lg' ? 56 : size === 'md' ? 40 : 28;
  const isDark = value.includes('rgba') || /^#[0-9a-f]{6}$/i.test(value) && parseInt(value.slice(1, 3), 16) < 128 && parseInt(value.slice(3, 5), 16) < 128 && parseInt(value.slice(5, 7), 16) < 128;
  return (
    <div style={{ minWidth: 80, flex: '1 1 80px' }}>
      <div style={{ height: h, background: value, borderRadius: 6, border: '1px solid var(--pxd-color-border-subtle)', marginBottom: 4 }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--pxd-color-text-primary)', whiteSpace: 'nowrap' }}>{name}</div>
      <div style={{ fontSize: 10, color: 'var(--pxd-color-text-tertiary)', fontFamily: 'var(--pxd-font-mono)' }}>{value}</div>
      {token && <div style={{ fontSize: 10, color: 'var(--pxd-color-text-accent)', fontFamily: 'var(--pxd-font-mono)' }}>{token}</div>}
    </div>
  );
}

function GrayRamp() {
  const grays = [
    ['0', color.core.gray0], ['50', color.core.gray50], ['100', color.core.gray100],
    ['200', color.core.gray200], ['300', color.core.gray300], ['400', color.core.gray400],
    ['500', color.core.gray500], ['600', color.core.gray600], ['700', color.core.gray700],
    ['800', color.core.gray800], ['900', color.core.gray900],
  ];
  return (
    <div style={s.swatchRow}>
      {grays.map(([step, val]) => <Swatch key={step} name={`gray${step}`} value={val} size="sm" />)}
    </div>
  );
}

export const CorePalette: Story = {
  name: '1. Core Palette',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Core Palette</h1>
      <p style={s.lead}>Primitive color values. These are never used directly in components — they feed into semantic and brand tokens.</p>

      <h3 style={s.h3}>Neutral Gray Scale</h3>
      <GrayRamp />

      {(['blue', 'green', 'yellow', 'red', 'purple', 'pink', 'cyan'] as const).map(hue => (
        <div key={hue}>
          <h3 style={s.h3}>{hue.charAt(0).toUpperCase() + hue.slice(1)}</h3>
          <div style={s.swatchRow}>
            {['300', '500', '700'].map(step => {
              const key = `${hue}${step}` as keyof typeof color.core;
              return <Swatch key={step} name={`${hue}${step}`} value={(color.core as Record<string, string>)[key]} />;
            })}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const SemanticColors: Story = {
  name: '2. Semantic Colors',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Semantic Colors</h1>
      <p style={s.lead}>UI-meaning tokens used in all components. These switch automatically between light and dark modes.</p>

      <h2 style={s.h2}>Surface</h2>
      <div style={s.grid}>
        {Object.entries(color.semantic.surface).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} token={`--pxd-color-surface-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`} size="lg" />
        ))}
      </div>

      <h2 style={s.h2}>Text</h2>
      <div style={s.grid}>
        {Object.entries(color.semantic.text).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--pxd-color-surface-secondary)', borderRadius: 6, padding: '8px 12px' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: v, border: '1px solid var(--pxd-color-border-subtle)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)', fontFamily: 'var(--pxd-font-mono)' }}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Border</h2>
      <div style={s.swatchRow}>
        {Object.entries(color.semantic.border).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} token={`--pxd-color-border-${k}`} size="sm" />
        ))}
      </div>

      <h2 style={s.h2}>Feedback</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 16 }}>
        {Object.entries(color.semantic.feedback).map(([k, v]) => (
          <div key={k} style={{ padding: '8px 16px', background: v, borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 13 }}>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Action</h2>
      <div style={s.grid}>
        {Object.entries(color.semantic.action).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} token={`--pxd-color-action-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`} />
        ))}
      </div>
    </div>
  ),
};

export const BrandColors: Story = {
  name: '3. Brand Colors',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Brand Colors</h1>
      <p style={s.lead}>Pixdone identity tokens. Use for brand moments, game-mechanic states, and celebratory UI.</p>

      <h2 style={s.h2}>Pixdone Palette</h2>
      <div style={s.grid}>
        {Object.entries(color.brand.pixdone).map(([k, v]) => (
          <Swatch key={k} name={k} value={v} token={`--pxd-color-brand-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`} size="lg" />
        ))}
      </div>

      <h2 style={s.h2}>Rarity System</h2>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 24 }}>
        {Object.entries(color.brand.rarity).map(([k, v]) => (
          <div key={k} style={{ padding: '10px 20px', background: v, borderRadius: 6, color: '#fff', fontWeight: 700, fontSize: 13, boxShadow: '2px 2px 0 rgba(25,29,36,0.7)', textTransform: 'capitalize' }}>
            {k}
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Reward Glows</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
        {Object.entries(color.brand.rewardGlow).map(([k, v]) => (
          <div key={k} style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--pxd-color-surface-primary)', boxShadow: `0 0 0 8px ${v}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--pxd-color-text-secondary)' }}>
            {k}
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ContrastAccessibility: Story = {
  name: '4. Contrast & Accessibility',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Contrast & Accessibility</h1>
      <p style={s.lead}>All text/background pairings in the system meet WCAG AA (4.5:1 for body, 3:1 for large text).</p>

      <h2 style={s.h2}>Verified Pairings</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        {[
          { fg: color.semantic.text.primary, bg: color.semantic.surface.primary, label: 'text.primary on surface.primary', ratio: '16.8:1', pass: 'AAA' },
          { fg: color.semantic.text.secondary, bg: color.semantic.surface.primary, label: 'text.secondary on surface.primary', ratio: '8.0:1', pass: 'AAA' },
          { fg: color.semantic.text.tertiary, bg: color.semantic.surface.primary, label: 'text.tertiary on surface.primary', ratio: '5.2:1', pass: 'AA' },
          { fg: color.semantic.text.inverse, bg: color.semantic.surface.inverse, label: 'text.inverse on surface.inverse', ratio: '16.8:1', pass: 'AAA' },
          { fg: '#FFFFFF', bg: color.brand.pixdone.primary, label: 'White on brand.primary', ratio: '4.6:1', pass: 'AA' },
          { fg: '#FFFFFF', bg: color.semantic.feedback.danger, label: 'White on feedback.danger', ratio: '4.7:1', pass: 'AA' },
          { fg: color.semantic.text.danger, bg: color.semantic.surface.primary, label: 'text.danger on surface.primary', ratio: '5.8:1', pass: 'AA' },
          { fg: color.semantic.text.success, bg: color.semantic.surface.primary, label: 'text.success on surface.primary', ratio: '5.4:1', pass: 'AA' },
        ].map(({ fg, bg, label, ratio, pass }) => (
          <div key={label} style={{ background: bg, border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, padding: 16 }}>
            <div style={{ color: fg, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Sample Text Aa</div>
            <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)' }}>{label}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12, fontWeight: 700, color: fg }}>{ratio}</span>
              <span style={{ background: pass === 'AAA' ? color.semantic.feedback.success : color.semantic.feedback.info, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{pass}</span>
            </div>
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Rules</h2>
      <ul style={{ paddingLeft: 20, lineHeight: 2, fontSize: 14, color: 'var(--pxd-color-text-secondary)' }}>
        <li>Body text (≤16px, regular weight): minimum <strong>4.5:1</strong> contrast ratio</li>
        <li>Large text (≥18px regular or ≥14px bold): minimum <strong>3.0:1</strong></li>
        <li>UI components and graphical elements: minimum <strong>3.0:1</strong></li>
        <li>Color is never the <em>only</em> signal — always pair with shape, label, or icon</li>
        <li>Focus indicators: 3px minimum perimeter, 3:1 contrast against adjacent colors</li>
      </ul>
    </div>
  ),
};

export const DarkModeTokens: Story = {
  name: '5. Dark Mode',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Dark Mode</h1>
      <p style={s.lead}>Pixdone uses a single semantic token layer. ThemeProvider switches CSS variable values at runtime — components never change their token references.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <h3 style={s.h3}>Light Mode Values</h3>
          <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #DDDEE3' }}>
            {[
              ['surface.page', '#F7F7F8'],
              ['surface.primary', '#FFFFFF'],
              ['text.primary', '#191D24'],
              ['text.secondary', '#4C5160'],
              ['border.default', '#A6AAB6'],
              ['action.primary', '#7B61FF'],
            ].map(([token, val]) => (
              <div key={token} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #EFEFF1' }}>
                <code style={{ color: '#5B43D6' }}>{token}</code>
                <span style={{ color: '#666C7A', fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 style={s.h3}>Dark Mode Values (ThemeProvider)</h3>
          <div style={{ background: '#191D24', borderRadius: 8, padding: 20, border: '1px solid #2E3440' }}>
            {[
              ['surface.page', '#191D24'],
              ['surface.primary', '#2E3440'],
              ['text.primary', '#FCFCFC'],
              ['text.secondary', '#C7C9D1'],
              ['border.default', '#4C5160'],
              ['action.primary', '#7B61FF'],
            ].map(([token, val]) => (
              <div key={token} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid #2E3440' }}>
                <code style={{ color: '#B79CFF' }}>{token}</code>
                <span style={{ color: '#A6AAB6', fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--pxd-color-surface-secondary)', borderRadius: 8, padding: 20, borderLeft: '4px solid var(--pxd-color-feedback-info)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Implementation</div>
        <p style={{ fontSize: 13, color: 'var(--pxd-color-text-secondary)', margin: 0 }}>
          Wrap your app in <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>{'<ThemeProvider>'}</code>.
          It sets <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>data-theme</code> on the root element and
          injects the correct CSS variable values. Components only reference <code style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12 }}>--pxd-*</code> tokens
          and respond automatically to theme changes.
        </p>
      </div>
    </div>
  ),
};
