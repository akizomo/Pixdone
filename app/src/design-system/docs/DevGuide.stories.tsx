import type { Meta, StoryObj } from '@storybook/react-vite';

const meta: Meta = {
  title: 'Design System/Developer Guide',
  parameters: {
    docs: {
      description: {
        component:
          'Complete developer reference for integrating and extending the Pixdone Design System.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const s = {
  page: { fontFamily: 'var(--pxd-font-body)', color: 'var(--pxd-color-text-primary)', maxWidth: 860 } as React.CSSProperties,
  h1: { fontFamily: 'var(--pxd-font-display)', fontSize: 18, letterSpacing: '0.04em', color: 'var(--pxd-color-brand-primary)', marginBottom: 8 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12, marginTop: 32 } as React.CSSProperties,
  h3: { fontSize: 14, fontWeight: 600, marginBottom: 8, marginTop: 20 } as React.CSSProperties,
  lead: { fontSize: 14, color: 'var(--pxd-color-text-secondary)', lineHeight: 1.6, marginBottom: 24 } as React.CSSProperties,
  code: { fontFamily: 'var(--pxd-font-mono)', fontSize: 12, background: 'var(--pxd-color-surface-secondary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 4, padding: '2px 6px' } as React.CSSProperties,
  pre: { fontFamily: 'var(--pxd-font-mono)', fontSize: 12, background: 'var(--pxd-color-surface-inverse)', color: '#e8eaed', borderRadius: 8, padding: 20, overflowX: 'auto' as const, lineHeight: 1.6 } as React.CSSProperties,
  infoBox: { background: 'rgba(76,141,255,0.08)', border: '2px solid var(--pxd-color-feedback-info)', borderRadius: 8, padding: 16, marginBottom: 16 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13, marginBottom: 24 } as React.CSSProperties,
  th: { padding: '8px 12px', textAlign: 'left' as const, fontWeight: 600, borderBottom: '2px solid var(--pxd-color-border-subtle)', background: 'var(--pxd-color-surface-secondary)' } as React.CSSProperties,
  td: { padding: '8px 12px', borderBottom: '1px solid var(--pxd-color-border-subtle)' } as React.CSSProperties,
};

export const GettingStarted: Story = {
  name: '1. Getting Started',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Developer Guide</h1>
      <p style={s.lead}>Everything you need to use the Pixdone Design System in your React + TypeScript app.</p>

      <h2 style={s.h2}>Quick Start</h2>
      <pre style={s.pre}>{`// 1. Wrap your app with ThemeProvider (handles CSS variables + dark/light mode)
import { ThemeProvider } from './design-system';
import './design-system/foundations/tokens.css'; // CSS variables

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}`}</pre>

      <h2 style={s.h2}>Importing Components</h2>
      <pre style={s.pre}>{`// Named imports from design-system index
import { Button, Badge, Card, Toggle } from './design-system';

// Or directly from component folder (for tree-shaking)
import { Button } from './design-system/components/Button/Button';
import { Badge }  from './design-system/components/Badge/Badge';`}</pre>

      <h2 style={s.h2}>Using Design Tokens in CSS</h2>
      <pre style={s.pre}>{`/* Always use --pxd-* variables, never hardcode values */
.my-component {
  color:      var(--pxd-color-text-primary);
  background: var(--pxd-color-surface-primary);
  padding:    var(--pxd-space-4);        /* 16px */
  border-radius: var(--pxd-radius-md);  /* 8px */
  font-family:   var(--pxd-font-body);
  transition: color var(--pxd-motion-fast) var(--pxd-easing-standard);
}

/* Focus ring (always implement this) */
.my-interactive:focus-visible {
  outline: 2px solid var(--pxd-color-focus-ring);
  outline-offset: 2px;
}`}</pre>

      <h2 style={s.h2}>Using Design Tokens in TypeScript</h2>
      <pre style={s.pre}>{`import { color, spacing, typography, motion } from './design-system/foundations';

// Access token values directly
const primaryColor  = color.semantic.action.primary; // '#7B61FF'
const baseSpacing   = spacing[4];                    // 16
const bodyFont      = typography.fontFamily.body;
const fastDuration  = motion.duration.fast;          // 120`}</pre>
    </div>
  ),
};

export const ComponentCreationGuide: Story = {
  name: '2. Creating New Components',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Creating New Components</h1>
      <p style={s.lead}>Follow this structure for every new design system component.</p>

      <h2 style={s.h2}>File Structure</h2>
      <pre style={s.pre}>{`design-system/components/
└── MyComponent/
    ├── MyComponent.types.ts    # TypeScript interfaces
    ├── MyComponent.css         # Token-driven styles
    ├── MyComponent.tsx         # React component
    └── MyComponent.stories.tsx # Storybook stories`}</pre>

      <h2 style={s.h2}>Component Template</h2>
      <pre style={s.pre}>{`// MyComponent.types.ts
export type MyVariant = 'primary' | 'secondary';
export interface MyComponentProps {
  variant?: MyVariant;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

// MyComponent.tsx
import type { MyComponentProps } from './MyComponent.types';
import './MyComponent.css';

export function MyComponent({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  ...rest
}: MyComponentProps) {
  return (
    <div
      className={[
        'pxd-my-component',
        \`pxd-my-component--\${variant}\`,
        disabled ? 'pxd-my-component--disabled' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-disabled={disabled}
      {...rest}
    >
      {children}
    </div>
  );
}`}</pre>

      <h2 style={s.h2}>CSS Template</h2>
      <pre style={s.pre}>{`/* MyComponent.css – BEM, token-driven */
.pxd-my-component {
  font-family: var(--pxd-font-body);
  /* NEVER hardcode values — always use tokens */
}
.pxd-my-component--primary  { /* primary styles */ }
.pxd-my-component--secondary { /* secondary styles */ }
.pxd-my-component--disabled {
  opacity: var(--pxd-opacity-disabled);
  cursor: not-allowed;
}
/* Focus state (required for a11y) */
.pxd-my-component:focus-visible {
  outline: 2px solid var(--pxd-color-focus-ring);
  outline-offset: 2px;
}
/* Reduced motion (required) */
@media (prefers-reduced-motion: reduce) {
  .pxd-my-component { transition: none; }
}`}</pre>
    </div>
  ),
};

export const AccessibilityChecklist: Story = {
  name: '3. Accessibility Checklist',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Accessibility Checklist</h1>
      <p style={s.lead}>Every component must pass this checklist before merging.</p>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {[
          { cat: 'Keyboard', items: ['Tab/Shift+Tab cycles focus through all interactive elements', 'Enter/Space activates buttons and controls', 'Escape closes popovers, modals, dropdowns', 'Arrow keys navigate within composite widgets (tabs, radios, menus)', 'Focus never gets trapped outside a modal'] },
          { cat: 'Screen Reader', items: ['Interactive elements have accessible names (via label, aria-label, or aria-labelledby)', 'Status changes announced via aria-live or role="status"', 'Error states use aria-invalid + aria-describedby to error message', 'Images have meaningful alt text (or alt="" if decorative)', 'Complex widgets use correct ARIA roles and properties'] },
          { cat: 'Visual', items: ['Focus ring visible in :focus-visible state (2px blue outline)', 'Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI', 'Color is not the only means of conveying information', 'Touch targets ≥ 44×44px', 'Text remains readable at 200% browser zoom'] },
          { cat: 'Motion', items: ['All animations respect prefers-reduced-motion', 'No content flashes more than 3 times per second', 'Auto-playing animations have a pause mechanism'] },
        ].map(({ cat, items }) => (
          <div key={cat} style={{ background: 'var(--pxd-color-surface-primary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--pxd-color-brand-primary)' }}>{cat}</div>
            <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 2, fontSize: 13 }}>
              {items.map(item => <li key={item} style={{ color: 'var(--pxd-color-text-secondary)' }}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const TokenReference: Story = {
  name: '4. Token Reference',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Token Quick Reference</h1>
      <p style={s.lead}>Most commonly used CSS custom properties. Full list in <code style={s.code}>design-tokens/tokens.json</code>.</p>

      {[
        { category: 'Color – Action', rows: [
          ['--pxd-color-action-primary', '#7B61FF', 'Primary button bg'],
          ['--pxd-color-action-primary-hover', '#6B52F0', 'Primary hover'],
          ['--pxd-color-action-secondary', '#FFFFFF', 'Secondary button bg'],
          ['--pxd-color-focus-ring', '#4C8DFF', 'Focus outline color'],
        ]},
        { category: 'Color – Text', rows: [
          ['--pxd-color-text-primary', '#191D24', 'Main text'],
          ['--pxd-color-text-secondary', '#4C5160', 'Supporting text'],
          ['--pxd-color-text-tertiary', '#666C7A', 'Metadata, placeholders'],
          ['--pxd-color-text-inverse', '#FFFFFF', 'Text on dark surfaces'],
          ['--pxd-color-text-danger', '#B93D3D', 'Error text'],
        ]},
        { category: 'Spacing', rows: [
          ['--pxd-space-1', '4px', 'XS gap'],
          ['--pxd-space-2', '8px', 'SM gap'],
          ['--pxd-space-3', '12px', 'Component inner pad'],
          ['--pxd-space-4', '16px', 'Standard pad / gutter'],
          ['--pxd-space-6', '24px', 'Section gap'],
          ['--pxd-space-8', '32px', 'Large section gap'],
        ]},
        { category: 'Motion', rows: [
          ['--pxd-motion-fast', '120ms', 'Button press, hover'],
          ['--pxd-motion-base', '180ms', 'General transitions'],
          ['--pxd-motion-slow', '240ms', 'Panels, modals'],
          ['--pxd-easing-standard', 'cubic-bezier(0.2,0,0,1)', 'Default easing'],
          ['--pxd-easing-playful', 'cubic-bezier(0.34,1.56,0.64,1)', 'Bounce/spring'],
        ]},
      ].map(({ category, rows }) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <h3 style={s.h3}>{category}</h3>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Variable</th>
                <th style={s.th}>Value</th>
                <th style={s.th}>Usage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([variable, value, usage]) => (
                <tr key={variable}>
                  <td style={{ ...s.td, fontFamily: 'var(--pxd-font-mono)', fontSize: 11, color: 'var(--pxd-color-text-accent)' }}>{variable}</td>
                  <td style={{ ...s.td, fontFamily: 'var(--pxd-font-mono)', fontSize: 11 }}>{value}</td>
                  <td style={{ ...s.td, color: 'var(--pxd-color-text-secondary)' }}>{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  ),
};

export const ComponentInventory: Story = {
  name: '5. Component Inventory',
  render: () => (
    <div style={s.page}>
      <h1 style={s.h1}>Component Inventory</h1>
      <p style={s.lead}>All 31 design system components with their categories and Storybook paths.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { category: 'Inputs & Forms', components: ['Button', 'IconButton', 'TextField', 'Textarea', 'Select', 'Checkbox', 'Radio / RadioGroup', 'Toggle', 'Chip', 'Slider (coming)'] },
          { category: 'Data Display', components: ['Badge', 'NumberBadge', 'Tag', 'Avatar', 'Progress', 'Skeleton'] },
          { category: 'Feedback', components: ['Alert', 'Toast', 'Banner', 'Spinner', 'EmptyState'] },
          { category: 'Layout & Containers', components: ['Card + CardHeader/Body/Footer', 'Divider', 'ModalDialog', 'BottomSheet'] },
          { category: 'Navigation', components: ['NavigationBar', 'TabBar', 'Tabs + TabPanel', 'ListItem'] },
          { category: 'Disclosure', components: ['Accordion', 'Tooltip (coming)', 'Popover (coming)'] },
        ].map(({ category, components }) => (
          <div key={category} style={{ background: 'var(--pxd-color-surface-primary)', border: '1px solid var(--pxd-color-border-subtle)', borderRadius: 8, padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--pxd-color-brand-primary)' }}>{category}</div>
            <ul style={{ paddingLeft: 16, margin: 0, lineHeight: 2, fontSize: 12 }}>
              {components.map(c => <li key={c} style={{ color: c.includes('coming') ? 'var(--pxd-color-text-tertiary)' : 'var(--pxd-color-text-secondary)', fontStyle: c.includes('coming') ? 'italic' : 'normal' }}>{c}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  ),
};
