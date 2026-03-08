import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Card** — General-purpose content container with optional header, body, and footer sub-components. **Variants:** default (subtle border), raised (soft shadow), outlined (stronger border), pixel (retro sharp shadow). **Interactive mode** adds hover/press states and keyboard activation. **Anatomy:** Card > CardHeader? + CardBody? + CardFooter?.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'raised', 'outlined', 'pixel'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: { variant: 'default', padding: 'md' },
  render: (args) => <Card {...args}><p style={{ margin: 0, fontSize: 14 }}>A simple card with padding.</p></Card>,
};

export const WithSubComponents: Story = {
  render: () => (
    <Card variant="raised" style={{ maxWidth: 360 } as any}>
      <CardHeader>Task Details</CardHeader>
      <CardBody>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--pxd-color-text-secondary)' }}>Complete the design system documentation and publish to Storybook for the team review.</p>
      </CardBody>
      <CardFooter>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" size="sm">Cancel</Button>
          <Button variant="primary" size="sm">Save</Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const PixelVariant: Story = {
  render: () => (
    <Card variant="pixel" padding="md" style={{ maxWidth: 300 } as any}>
      <div style={{ fontFamily: 'var(--pxd-font-display)', fontSize: 12, color: 'var(--pxd-color-brand-primary)', marginBottom: 8 }}>LEVEL UP!</div>
      <p style={{ margin: 0, fontSize: 13 }}>You've completed 10 tasks today. XP reward unlocked!</p>
    </Card>
  ),
};

export const InteractiveCard: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, maxWidth: 600 }}>
      {['Work', 'Personal', 'Learning'].map(list => (
        <Card key={list} variant="outlined" padding="md" interactive onClick={() => alert(`Opened ${list}`)}>
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 14 }}>{list}</div>
          <div style={{ fontSize: 12, color: 'var(--pxd-color-text-tertiary)' }}>5 tasks</div>
        </Card>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'Interactive cards act as buttons. Full keyboard and pointer support.' } } },
};

export const TaskCard: Story = {
  render: () => (
    <Card variant="default" style={{ maxWidth: 380 } as any}>
      <CardBody>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Finalize design tokens</div>
          <Badge variant="warning">At Risk</Badge>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--pxd-color-text-secondary)' }}>Export tokens to JSON and update Figma variables.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--pxd-color-surface-secondary)', borderRadius: 2 }}>
            <div style={{ width: '60%', height: '100%', background: 'var(--pxd-color-brand-primary)', borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 11, color: 'var(--pxd-color-text-tertiary)' }}>3/5</span>
        </div>
      </CardBody>
    </Card>
  ),
};
