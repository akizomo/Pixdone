import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Design System/Principles',
  parameters: {
    docs: {
      description: {
        component: 'The philosophical foundation of the Pixdone Design System.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = {
  page: {
    fontFamily: 'var(--pxd-font-body)',
    color: 'var(--pxd-color-text-primary)',
    maxWidth: 860,
    margin: '0 auto',
  } as React.CSSProperties,
  h1: {
    fontFamily: 'var(--pxd-font-display)',
    fontSize: 'var(--pxd-font-size-2xl)',
    letterSpacing: '0.04em',
    color: 'var(--pxd-color-brand-primary)',
    marginBottom: 8,
  } as React.CSSProperties,
  h2: {
    fontFamily: 'var(--pxd-font-body)',
    fontSize: 'var(--pxd-font-size-xl)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--pxd-color-text-primary)',
    marginBottom: 4,
    marginTop: 32,
  } as React.CSSProperties,
  h3: {
    fontFamily: 'var(--pxd-font-body)',
    fontSize: 'var(--pxd-font-size-md)',
    fontWeight: 600,
    color: 'var(--pxd-color-text-primary)',
    marginBottom: 4,
    marginTop: 0,
  } as React.CSSProperties,
  lead: {
    fontSize: 'var(--pxd-font-size-md)',
    color: 'var(--pxd-color-text-secondary)',
    lineHeight: 1.65,
    marginBottom: 32,
  } as React.CSSProperties,
  body: {
    fontSize: 'var(--pxd-font-size-sm)',
    color: 'var(--pxd-color-text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
    marginTop: 16,
  } as React.CSSProperties,
  card: {
    background: 'var(--pxd-color-surface-primary)',
    border: '2px solid var(--pxd-color-border-subtle)',
    borderRadius: 8,
    padding: 20,
  } as React.CSSProperties,
  pill: {
    display: 'inline-block',
    background: 'var(--pxd-color-action-secondary-hover)',
    color: 'var(--pxd-color-text-accent)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    borderRadius: 4,
    padding: '2px 8px',
    marginBottom: 12,
  } as React.CSSProperties,
  doBox: {
    background: 'rgba(53,194,107,0.10)',
    border: '2px solid var(--pxd-color-feedback-success)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  } as React.CSSProperties,
  dontBox: {
    background: 'rgba(232,93,93,0.08)',
    border: '2px solid var(--pxd-color-feedback-danger)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
  } as React.CSSProperties,
  doLabel: { color: 'var(--pxd-color-text-success)', fontWeight: 700, fontSize: 12, marginBottom: 8 } as React.CSSProperties,
  dontLabel: { color: 'var(--pxd-color-text-danger)', fontWeight: 700, fontSize: 12, marginBottom: 8 } as React.CSSProperties,
  divider: {
    borderTop: '1px solid var(--pxd-color-border-subtle)',
    margin: '32px 0',
  } as React.CSSProperties,
  tag: {
    display: 'inline-block',
    background: 'var(--pxd-color-surface-secondary)',
    border: '1px solid var(--pxd-color-border-subtle)',
    borderRadius: 4,
    padding: '2px 8px',
    fontSize: 12,
    color: 'var(--pxd-color-text-tertiary)',
    marginRight: 6,
  } as React.CSSProperties,
};

const PRINCIPLES = [
  {
    number: '01',
    title: 'Playful Precision',
    body: 'Pixdone lives at the intersection of retro gaming and modern productivity. Every interaction should feel intentional — crisp pixel shadows, snappy 120ms presses, reward animations that celebrate without distracting.',
    tags: ['Motion', 'Visual Design'],
  },
  {
    number: '02',
    title: 'Accessibility First',
    body: 'WCAG AA is the floor, not the ceiling. Every component ships with visible focus rings, ≥44px touch targets, semantic HTML, and full keyboard navigation. Color is never the only signal.',
    tags: ['A11y', 'WCAG AA'],
  },
  {
    number: '03',
    title: 'Token-Driven, Always',
    body: 'No hardcoded hex values in components. Every color, size, shadow, and motion value references a design token. This ensures one-edit-to-rule-them-all consistency and seamless dark/light mode.',
    tags: ['Tokens', 'Consistency'],
  },
  {
    number: '04',
    title: 'Single Responsibility',
    body: 'Each component does one thing well. Composition over complexity — small, focused primitives combine into rich patterns. If a component grows beyond a single clear purpose, split it.',
    tags: ['Architecture', 'Reusability'],
  },
  {
    number: '05',
    title: 'Progressive Delight',
    body: 'Core functionality is always available immediately. Animations, reward effects, and haptic-like press feedback layer on top — never blocking the essential task. Respect `prefers-reduced-motion`.',
    tags: ['Motion', 'A11y'],
  },
  {
    number: '06',
    title: 'Purposeful Hierarchy',
    body: 'Visual weight communicates importance. One primary action per view. Secondary actions step back with secondary/ghost variants. Pixel shadows escalate emphasis: ghost < secondary < primary < reward.',
    tags: ['Visual Design', 'UX'],
  },
];

const DOS_DONTS = [
  {
    context: 'Primary Actions',
    do: 'Use one primary button per view. Let it be the obvious next step.',
    dont: 'Stack multiple primary buttons — they cancel each other out.',
  },
  {
    context: 'Color as Signal',
    do: 'Pair color with an icon or label for feedback states (success, error).',
    dont: 'Rely on color alone to convey meaning — 1 in 12 men has color vision deficiency.',
  },
  {
    context: 'Motion',
    do: 'Keep UI motion under 240ms. Save longer animations for reward moments.',
    dont: 'Animate decoratively on every interaction — it trains users to ignore motion.',
  },
  {
    context: 'Typography',
    do: 'Use the pixel font (`Press Start 2P`) for brand moments, scores, and celebration.',
    dont: 'Use the pixel font for body copy — it significantly reduces readability at small sizes.',
  },
  {
    context: 'Spacing',
    do: 'Use spacing tokens (4, 8, 12, 16, 24, 32…) — stay on the 4px grid.',
    dont: 'Use arbitrary values like 10px, 15px, 22px — they break visual rhythm.',
  },
  {
    context: 'Touch Targets',
    do: 'Ensure all interactive elements meet the 44×44px minimum touch target.',
    dont: 'Scale down interactive elements below 36px height even when space is tight.',
  },
];

export const Introduction: Story = {
  name: '1. Introduction',
  render: () => (
    <div style={s.page}>
      <div style={s.pill}>Design System</div>
      <h1 style={s.h1}>Pixdone</h1>
      <p style={s.lead}>
        A pixel-precision design system for the Pixdone productivity app. Built on a three-layer token
        architecture, 30+ accessible components, and a philosophy that treats every interaction as
        a small moment of joy.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Components', value: '30+' },
          { label: 'Token Layers', value: '3' },
          { label: 'WCAG Level', value: 'AA' },
        ].map(({ label, value }) => (
          <div key={label} style={{ ...s.card, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--pxd-font-display)', fontSize: 28, color: 'var(--pxd-color-brand-primary)', marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      <h2 style={s.h2}>Architecture</h2>
      <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
        {[
          { layer: 'Core', desc: 'Primitive values: raw hex, numbers, strings. Never reference directly in components.', color: 'var(--pxd-color-rarity-common)' },
          { layer: 'Semantic', desc: 'UI-meaning tokens: surface.page, text.primary, feedback.success. Use these in components.', color: 'var(--pxd-color-rarity-rare)' },
          { layer: 'Brand', desc: 'Pixdone identity: brand.primary, rarity.legendary, rewardGlow. Use for brand moments.', color: 'var(--pxd-color-brand-primary)' },
        ].map(({ layer, desc, color }, i) => (
          <div key={layer} style={{ flex: 1, padding: '16px 20px', background: 'var(--pxd-color-surface-secondary)', borderTop: `3px solid ${color}`, borderRight: i < 2 ? '1px solid var(--pxd-color-border-subtle)' : 'none' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color }}>{layer}</div>
            <p style={{ ...s.body, fontSize: 12 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const CorePrinciples: Story = {
  name: '2. Core Principles',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Core Principles</h1>
      <p style={s.lead}>Six principles that guide every design and engineering decision in Pixdone.</p>
      <div style={s.grid}>
        {PRINCIPLES.map(({ number, title, body, tags }) => (
          <div key={number} style={s.card}>
            <div style={{ fontFamily: 'var(--pxd-font-display)', fontSize: 10, color: 'var(--pxd-color-brand-primary)', marginBottom: 8, letterSpacing: '0.06em' }}>{number}</div>
            <h3 style={s.h3}>{title}</h3>
            <p style={{ ...s.body, marginBottom: 12 }}>{body}</p>
            <div>{tags.map(t => <span key={t} style={s.tag}>{t}</span>)}</div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const DosAndDonts: Story = {
  name: "3. Do's & Don'ts",
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>{"Do's & Don'ts"}</h1>
      <p style={s.lead}>Practical guidance for common design decisions.</p>
      {DOS_DONTS.map(({ context, do: doText, dont }) => (
        <div key={context} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pxd-color-text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{context}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={s.doBox}>
              <div style={s.doLabel}>✓ DO</div>
              <p style={s.body}>{doText}</p>
            </div>
            <div style={s.dontBox}>
              <div style={s.dontLabel}>✗ DON'T</div>
              <p style={s.body}>{dont}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const NamingConventions: Story = {
  name: '4. Naming Conventions',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Naming Conventions</h1>
      <p style={s.lead}>Consistent naming makes the system predictable and learnable.</p>

      {[
        { category: 'Components', pattern: 'PascalCase', examples: ['Button', 'ModalDialog', 'NavigationBar', 'TaskItem'] },
        { category: 'Component Props', pattern: 'camelCase', examples: ['variant', 'size', 'isDisabled', 'onPress', 'fullWidth'] },
        { category: 'CSS Classes', pattern: 'BEM: pxd-[component]__[element]--[modifier]', examples: ['pxd-button', 'pxd-button--primary', 'pxd-button--sm', 'pxd-card__header'] },
        { category: 'CSS Variables', pattern: '--pxd-[category]-[subcategory]-[property]', examples: ['--pxd-color-action-primary', '--pxd-space-4', '--pxd-radius-md', '--pxd-motion-fast'] },
        { category: 'Token Keys', pattern: 'camelCase path-notation', examples: ['color.semantic.text.primary', 'spacing.4', 'motion.duration.base'] },
        { category: 'Events', pattern: 'on + PascalCase verb', examples: ['onClick', 'onChange', 'onDismiss', 'onComplete'] },
        { category: 'Story Exports', pattern: 'PascalCase description', examples: ['Primary', 'AllVariants', 'StateComparison', 'HierarchyExample'] },
      ].map(({ category, pattern, examples }) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <h3 style={s.h3}>{category}</h3>
          <div style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12, color: 'var(--pxd-color-text-accent)', background: 'var(--pxd-color-surface-secondary)', padding: '4px 10px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>{pattern}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {examples.map(ex => (
              <code key={ex} style={{ fontFamily: 'var(--pxd-font-mono)', fontSize: 12, background: 'var(--pxd-color-surface-secondary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 4, padding: '2px 8px' }}>{ex}</code>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
