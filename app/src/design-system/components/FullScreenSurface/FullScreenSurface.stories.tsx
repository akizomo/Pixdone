import type { Meta, StoryObj } from '@storybook/react-vite';
import { FullScreenSurface } from './FullScreenSurface';
import { IconButton } from '../IconButton/IconButton';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import './FullScreenSurface.stories.css';

const meta: Meta<typeof FullScreenSurface> = {
  title: 'Components/FullScreenSurface',
  component: FullScreenSurface,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-screen layer for the native app. Switch the "Safe Area" toolbar to iPhone to see the status bar / home indicator insets.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FullScreenSurface>;

export const WithCloseButton: Story = {
  args: {
    'aria-label': 'Full-screen example',
    role: 'dialog',
    children: (
      <>
        <IconButton
          variant="ghost"
          aria-label="Close"
          icon={<PixelIcon name="close" />}
          className="fullscreen-story__close"
        />
        <div className="fullscreen-story__body">Content stays inside the safe area.</div>
      </>
    ),
  },
};
