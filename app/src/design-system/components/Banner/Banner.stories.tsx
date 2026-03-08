import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from './Banner';

const meta: Meta<typeof Banner> = {
  title: 'Components/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Banner** — Full-width page-level notification, positioned at the top of a view. **Vs Alert:** Banners are page-level (below nav or top of content area); Alerts are inline within content. **Anatomy:** Icon + Content + optional action link + optional dismiss. **When to use:** System status, maintenance notices, feature announcements, global warnings.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'danger', 'brand'] },
  },
};
export default meta;
type Story = StoryObj<typeof Banner>;

export const Info: Story = { args: { variant: 'info', children: 'New version available.', actionLabel: 'Update now', dismissible: true } };
export const Warning: Story = { args: { variant: 'warning', title: 'Maintenance:', children: 'Scheduled maintenance on Friday 11 PM–1 AM UTC.', dismissible: true } };
export const Danger: Story = { args: { variant: 'danger', title: 'Sync error:', children: 'Tasks not saving. Check your connection.', actionLabel: 'Retry' } };
export const Brand: Story = { args: { variant: 'brand', children: '🎉 Pixdone Pro — Get unlimited lists + XP boosts.', actionLabel: 'Upgrade', dismissible: true } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Banner variant="info" dismissible>Informational page-level message.</Banner>
      <Banner variant="success">Action completed across all devices.</Banner>
      <Banner variant="warning" title="Warning:">This action cannot be undone.</Banner>
      <Banner variant="danger" title="Error:" actionLabel="Retry">Failed to sync changes.</Banner>
      <Banner variant="brand" actionLabel="Learn more" dismissible>Pixdone v2 is here — explore new features!</Banner>
    </div>
  ),
};
