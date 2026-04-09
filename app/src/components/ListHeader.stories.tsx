import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, userEvent, within, expect } from 'storybook/test';
import { ListHeader } from './ListHeader';

const meta: Meta<typeof ListHeader> = {
  title: 'PixDone/App/ListHeader',
  component: ListHeader,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    showMenu: { control: 'boolean' },
  },
  args: { onRename: fn(), onDelete: fn() },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const MyTasks: Story = {
  args: { title: 'My Tasks', showMenu: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText('My Tasks')).toBeTruthy();
    // No menu button when showMenu=false
    const menuBtn = canvasElement.querySelector('[aria-label="List options"]');
    expect(menuBtn).toBeNull();
  },
};

export const WithMenu: Story = {
  args: { title: 'Shopping', showMenu: true, onRename: fn(), onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const menuBtn = canvas.getByLabelText('List options');
    // Menu is initially closed
    expect(menuBtn.getAttribute('aria-expanded')).toBe('false');
    // Open menu
    await userEvent.click(menuBtn);
    expect(menuBtn.getAttribute('aria-expanded')).toBe('true');
    // Rename and Delete items are visible
    expect(canvas.getByText(/Rename/i)).toBeTruthy();
    expect(canvas.getByText(/Delete/i)).toBeTruthy();
    // Click rename
    await userEvent.click(canvas.getByText(/Rename/i));
    expect(args.onRename).toHaveBeenCalledOnce();
  },
};

export const SmashList: Story = {
  args: { title: '💥 Smash List', showMenu: false },
};

export const DeleteFromMenu: Story = {
  args: { title: 'Work', showMenu: true, onRename: fn(), onDelete: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByLabelText('List options'));
    await userEvent.click(canvas.getByText(/Delete/i));
    expect(args.onDelete).toHaveBeenCalledOnce();
  },
};
