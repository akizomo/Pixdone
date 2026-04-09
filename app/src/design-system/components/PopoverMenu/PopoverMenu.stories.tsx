import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PopoverMenu } from './PopoverMenu';
import { IconButton } from '../IconButton/IconButton';

const meta: Meta<typeof PopoverMenu> = {
  title: 'Components/PopoverMenu',
  component: PopoverMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**When to use:** Context actions triggered by a button — settings menus, overflow actions, move-to-list, etc. Follows the same visual pattern as the account menu and list header menu. **Hover:** `background-hover` only (no transform). **Keyboard:** Escape closes; focus-visible ring on items. **Closing:** Click outside or Escape. **Animation:** 180ms slide-in from top.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '80px 40px', position: 'relative', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof PopoverMenu>;

const defaultItems = [
  { id: 'rename', label: 'Rename', icon: 'edit' },
  { id: 'move', label: 'Move to list', icon: 'drive_file_move' },
  { id: 'duplicate', label: 'Duplicate', icon: 'content_copy' },
  { id: 'delete', label: 'Delete', icon: 'delete', danger: true },
];

export const Default: Story = {
  args: {
    items: defaultItems,
    onSelect: (id) => console.log('selected:', id),
    onClose: () => console.log('close'),
  },
};

export const WithHeader: Story = {
  args: {
    header: 'Move to list',
    items: [
      { id: 'work', label: 'Work', icon: 'folder' },
      { id: 'personal', label: 'Personal', icon: 'folder' },
      { id: 'shopping', label: 'Shopping', icon: 'folder' },
    ],
    onSelect: (id) => console.log('move to:', id),
    onClose: () => console.log('close'),
  },
};

export const AlignLeft: Story = {
  args: {
    align: 'left',
    items: defaultItems,
    onSelect: (id) => console.log('selected:', id),
    onClose: () => console.log('close'),
  },
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      { id: 'rename', label: 'Rename', icon: 'edit' },
      { id: 'archive', label: 'Archive (coming soon)', icon: 'archive', disabled: true },
      { id: 'delete', label: 'Delete', icon: 'delete', danger: true },
    ],
    onSelect: (id) => console.log('selected:', id),
    onClose: () => console.log('close'),
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<span className="material-icons">more_vert</span>}
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
        />
        {open && (
          <PopoverMenu
            items={defaultItems}
            onSelect={(id) => { setSelected(id); setOpen(false); }}
            onClose={() => setOpen(false)}
          />
        )}
        {selected && (
          <div style={{
            marginTop: '16px',
            fontFamily: 'var(--pd-font-body)',
            fontSize: '0.875rem',
            color: 'var(--pd-color-text-secondary)',
          }}>
            Selected: <strong>{selected}</strong>
          </div>
        )}
      </div>
    );
  },
};

export const MoveToListExample: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<span className="material-icons">drive_file_move</span>}
          onClick={() => setOpen((v) => !v)}
          aria-label="Move to list"
        />
        {open && (
          <PopoverMenu
            header="Move to list"
            items={[
              { id: 'work', label: 'Work', icon: 'folder' },
              { id: 'personal', label: 'Personal', icon: 'folder' },
              { id: 'groceries', label: 'Groceries', icon: 'folder' },
            ]}
            onSelect={(id) => { console.log('move to:', id); setOpen(false); }}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    );
  },
};
