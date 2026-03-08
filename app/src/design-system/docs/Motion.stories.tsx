import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

const meta: Meta = {
  title: 'Design System/Motion',
  parameters: {
    docs: {
      description: {
        component:
          'Motion tokens for Pixdone. Standard UI interactions: 80–240ms. Reward/celebration: up to 700ms. Always respect `prefers-reduced-motion` — all durations resolve to 0ms for users who opt out.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const s = {
  page: { fontFamily: 'var(--pxd-font-body)', color: 'var(--pxd-color-text-primary)', maxWidth: 860 } as React.CSSProperties,
  h1: { fontFamily: 'var(--pxd-font-display)', fontSize: 18, letterSpacing: '0.04em', color: 'var(--pxd-color-brand-primary)', marginBottom: 8 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16, marginTop: 36 } as React.CSSProperties,
  lead: { fontSize: 14, color: 'var(--pxd-color-text-secondary)', lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
};

export const DurationTokens: Story = {
  name: '1. Duration Tokens',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Duration Tokens</h1>
      <p style={s.lead}>Six duration steps mapped to interaction types. Never hardcode millisecond values.</p>
      <div style={{ marginBottom: 32 }}>
        {[
          { name: 'instant', ms: 80, token: '--pxd-motion-instant', use: 'Tooltip open, badge appear, micro state changes' },
          { name: 'fast', ms: 120, token: '--pxd-motion-fast', use: 'Button press, hover state changes, toggle' },
          { name: 'base', ms: 180, token: '--pxd-motion-base', use: 'Dropdown open, checkbox, general transitions' },
          { name: 'slow', ms: 240, token: '--pxd-motion-slow', use: 'Modal enter, side panel slide, accordion expand' },
          { name: 'slower', ms: 320, token: '--pxd-motion-slower', use: 'Page transitions, full-screen overlays' },
          { name: 'reward', ms: 700, token: '--pxd-motion-reward', use: 'Task completion celebration, level-up animation' },
        ].map(({ name, ms, token, use }) => (
          <div key={name} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--pxd-color-border-subtle)', paddingTop: 12, paddingBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div style={{ fontFamily: 'var(--pxd-font-display)', fontSize: 10, color: 'var(--pxd-color-brand-primary)', letterSpacing: '0.04em' }}>{ms}ms</div>
            </div>
            <div style={{ position: 'relative' as const, height: 8, background: 'var(--pxd-color-surface-secondary)', borderRadius: 4 }}>
              <div style={{ position: 'absolute' as const, left: 0, top: 0, height: '100%', width: `${(ms / 700) * 100}%`, background: 'var(--pxd-color-brand-primary)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)' }}>
              <code style={{ fontFamily: 'var(--pxd-font-mono)', display: 'block', marginBottom: 2 }}>{token}</code>
              {use}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(53,194,107,0.10)', border: '2px solid var(--pxd-color-feedback-success)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--pxd-color-text-success)' }}>Reduced Motion</div>
        <p style={{ fontSize: 13, margin: 0, color: 'var(--pxd-color-text-secondary)' }}>
          All motion tokens resolve to <code style={{ fontFamily: 'var(--pxd-font-mono)' }}>0ms</code> when{' '}
          <code style={{ fontFamily: 'var(--pxd-font-mono)' }}>@media (prefers-reduced-motion: reduce)</code> is active.
          This is handled at the CSS variable level — components get accessibility for free.
        </p>
      </div>
    </div>
  ),
};

export const EasingCurves: Story = {
  name: '2. Easing Curves',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Easing Curves</h1>
      <p style={s.lead}>Five easing functions matched to their motion intent.</p>
      <div style={{ display: 'grid', gap: 20 }}>
        {[
          { name: 'standard', token: '--pxd-easing-standard', curve: 'cubic-bezier(0.2, 0, 0, 1)', use: 'General UI transitions, color changes, opacity', pattern: 'Elements that stay on screen' },
          { name: 'decelerate', token: '--pxd-easing-decelerate', curve: 'cubic-bezier(0, 0, 0, 1)', use: 'Elements entering the screen (modal, sheet, dropdown)', pattern: 'Objects entering from outside viewport' },
          { name: 'accelerate', token: '--pxd-easing-accelerate', curve: 'cubic-bezier(0.3, 0, 1, 1)', use: 'Elements leaving the screen (dismiss, close)', pattern: 'Objects exiting to outside viewport' },
          { name: 'playful', token: '--pxd-easing-playful', curve: 'cubic-bezier(0.34, 1.56, 0.64, 1)', use: 'Reward pop, bounce effects, celebration', pattern: 'Overshoots target briefly — springs back' },
          { name: 'press', token: '--pxd-easing-press', curve: 'cubic-bezier(0.2, 0, 0, 1)', use: 'Button press scale, active state', pattern: 'Immediate, responsive feeling' },
        ].map(({ name, token, curve, use, pattern }) => (
          <div key={name} style={{ display: 'flex', gap: 20, alignItems: 'center', background: 'var(--pxd-color-surface-primary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, padding: 16 }}>
            <div style={{ width: 120, flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{name}</div>
              <code style={{ fontSize: 10, color: 'var(--pxd-color-text-accent)', fontFamily: 'var(--pxd-font-mono)' }}>{token}</code>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: 'var(--pxd-font-mono)', color: 'var(--pxd-color-text-secondary)', marginBottom: 4 }}>{curve}</div>
              <div style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)', marginBottom: 2 }}>{pattern}</div>
              <div style={{ fontSize: 12, color: 'var(--pxd-color-text-secondary)' }}>{use}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const ScaleTokens: Story = {
  name: '3. Scale & Interactive States',
  render: () => {
    const [active, setActive] = useState<string | null>(null);

    return (
      <div style={s.page}>
        <h1 style={s.h1}>Scale & Interactive States</h1>
        <p style={s.lead}>Transform scale values for press feedback, hover elevation, and reward effects. Click/press the demos below.</p>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, marginBottom: 40 }}>
          {[
            { name: 'press (0.96)', label: 'Press Me', transform: 'scale(0.96)', duration: 120, bg: 'var(--pxd-color-brand-primary)', desc: 'Button active state — scales to 0.96 instantly on press' },
            { name: 'hover (1.01)', label: 'Hover Me', transform: 'scale(1.01)', duration: 180, bg: 'var(--pxd-color-feedback-info)', desc: 'Subtle lift on hover — never more than 1.02' },
            { name: 'rewardPop (1.06)', label: 'Complete!', transform: 'scale(1.06)', duration: 320, bg: 'var(--pxd-color-brand-reward)', desc: 'Celebration bounce — short-lived, playful easing' },
            { name: 'modalEnter (0.98)', label: 'Modal Scale', transform: 'scale(0.98)', duration: 240, bg: 'var(--pxd-color-brand-secondary)', desc: 'Modal/dialog enter from slightly smaller' },
          ].map(({ name, label, transform, duration, bg, desc }) => (
            <div key={name}>
              <button
                onMouseDown={() => setActive(name)}
                onMouseUp={() => setTimeout(() => setActive(null), duration)}
                onMouseLeave={() => setActive(null)}
                style={{
                  display: 'block',
                  background: bg,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 24px',
                  fontFamily: 'var(--pxd-font-body)',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transform: active === name ? transform : 'scale(1)',
                  transition: `transform ${duration}ms cubic-bezier(0.2, 0, 0, 1)`,
                  marginBottom: 8,
                  minWidth: 140,
                  boxShadow: '2px 2px 0 rgba(25,29,36,0.7)',
                }}
              >
                {label}
              </button>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pxd-color-text-secondary)', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)', maxWidth: 160 }}>{desc}</div>
            </div>
          ))}
        </div>

        <h2 style={s.h2}>Named Animations</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { name: 'smashFeedback', duration: '120ms', easing: 'standard', scale: '0.96', use: 'Smash button press — immediate, snappy' },
            { name: 'rewardPop', duration: '320ms', easing: 'playful', scale: '1.06', use: 'Task completion, level-up celebration' },
            { name: 'freezeEffect', duration: '220ms', easing: 'standard', scale: '—', use: 'Freeze mechanic — CSS opacity + blur' },
            { name: 'rainbowEffect', duration: '700ms', easing: 'playful', scale: '—', use: 'Legendary completion — hue-rotate keyframe' },
            { name: 'bottomSheetEnter', duration: '240ms', easing: 'decelerate', scale: '—', use: 'Bottom sheet slide up — translateY(-100%)→0' },
          ].map(({ name, duration, easing, scale, use }) => (
            <div key={name} style={{ display: 'flex', gap: 16, background: 'var(--pxd-color-surface-secondary)', borderRadius: 6, padding: 12, fontSize: 13 }}>
              <code style={{ fontFamily: 'var(--pxd-font-mono)', fontWeight: 700, color: 'var(--pxd-color-text-accent)', minWidth: 160 }}>{name}</code>
              <span style={{ color: 'var(--pxd-color-text-tertiary)', minWidth: 60 }}>{duration}</span>
              <span style={{ color: 'var(--pxd-color-text-tertiary)', minWidth: 80 }}>{easing}</span>
              <span style={{ color: 'var(--pxd-color-text-tertiary)', minWidth: 40 }}>{scale}</span>
              <span style={{ color: 'var(--pxd-color-text-secondary)' }}>{use}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
};
