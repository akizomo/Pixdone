import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Toggle (Switch)** — Binary on/off control for settings with immediate effect. Use for: enabling features, notifications, preferences. **Not** for form submissions (use Checkbox instead). **Anatomy:** Hidden input + Track + Thumb + Label. **Accessibility:** Uses `role="switch"` with `aria-checked`. The visible track receives focus ring. Label is always associated via `<label>`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = { args: { label: 'Enable notifications' } };
export const Checked: Story = { args: { checked: true, label: 'Dark mode', onChange: () => {} } };
export const Disabled: Story = { args: { disabled: true, label: 'Premium feature' } };
export const DisabledChecked: Story = { args: { disabled: true, checked: true, label: 'Always on', onChange: () => {} } };
export const LabelLeft: Story = { args: { label: 'Streak reminders', labelPosition: 'left' } };

export const SettingsGroup: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--pxd-color-surface-primary)', borderRadius: 8, border: '1px solid var(--pxd-color-border-subtle)', overflow: 'hidden' }}>
      {[
        { label: 'Push notifications', defaultChecked: true },
        { label: 'Daily streak reminders', defaultChecked: true },
        { label: 'Sound effects', defaultChecked: false },
        { label: 'Haptic feedback', defaultChecked: false },
      ].map(({ label, defaultChecked }, i, arr) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--pxd-color-border-subtle)' : 'none' }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--pxd-color-text-primary)' }}>{label}</span>
          <Toggle defaultChecked={defaultChecked} aria-label={label} />
        </div>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Settings list with toggle controls.' } } },
};
