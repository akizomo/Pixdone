import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';

const meta: Meta<typeof Accordion> = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Accordion** — Collapsible sections for progressive disclosure. **Anatomy:** Container + Items (trigger button + panel). **Accessibility:** Full ARIA accordion pattern — `aria-expanded`, `aria-controls`, `aria-labelledby`. Keyboard: Tab to focus, Enter/Space to toggle. `multiple` prop allows independent sections. **When to use:** FAQs, settings categories, long-form content sections.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Accordion>;

const FAQ_ITEMS = [
  { id: 'q1', title: 'How does XP work?', children: 'You earn XP by completing tasks. The amount depends on task priority and difficulty. Level up to unlock new features and visual themes.' },
  { id: 'q2', title: 'What happens if I break my streak?', children: 'Your streak resets to 0. You can purchase a "Streak Shield" with accumulated XP to protect against one missed day per month.' },
  { id: 'q3', title: 'Can I share lists with my team?', children: 'Shared lists are available on the Pro plan. You can invite up to 10 collaborators per list and assign tasks to specific members.' },
  { id: 'q4', title: 'Is my data backed up?', children: 'Yes. All data is automatically synced to the cloud every 30 seconds. You can also export your data as CSV or JSON at any time.', disabled: false },
];

export const Default: Story = { args: { items: FAQ_ITEMS } };
export const DefaultOpen: Story = { args: { items: FAQ_ITEMS, defaultOpen: 'q1' } };
export const Multiple: Story = { args: { items: FAQ_ITEMS, multiple: true, defaultOpen: ['q1', 'q3'] } };
