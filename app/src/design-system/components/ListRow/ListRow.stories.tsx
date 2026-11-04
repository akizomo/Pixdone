import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ListRow } from './ListRow';
import { Chip } from '../Chip/Chip';
import { Toggle } from '../Toggle/Toggle';

const meta: Meta<typeof ListRow> = {
  title: 'Design System/ListRow',
  component: ListRow,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ListRow>;

export const Navigation: Story = {
  args: { icon: 'auto_awesome', label: 'Effects / Themes', onClick: () => {} },
};

export const WithDescription: Story = {
  args: { icon: 'person', label: 'PixDone+', description: 'Unlimited lists · Rare effects', onClick: () => {} },
};

export const ExternalLink: Story = {
  args: { icon: 'favorite', label: 'Support PixDone', href: 'https://example.com' },
};

export const Danger: Story = {
  args: { icon: 'delete', label: 'Delete account', variant: 'danger', soundKey: 'taskDelete', onClick: () => {} },
};

function SettingsGroup() {
  const [lang, setLang] = useState<'en' | 'ja'>('ja');
  const [sound, setSound] = useState(true);
  return (
    <div>
      <ListRow
        icon="language"
        label="Language"
        trailing={(
          <>
            <Chip variant="ghost" size="sm" selected={lang === 'en'} onClick={() => setLang('en')}>En</Chip>
            <Chip variant="ghost" size="sm" selected={lang === 'ja'} onClick={() => setLang('ja')}>Ja</Chip>
          </>
        )}
      />
      <ListRow icon={sound ? 'volume_up' : 'volume_off'} label="Sound" trailing={<Toggle label="Sound" checked={sound} onChange={setSound} />} />
      <ListRow icon="chat_bubble_outline" label="Feedback" onClick={() => {}} />
      <ListRow icon="logout" label="Log out" soundKey="taskComplete" onClick={() => {}} />
    </div>
  );
}

export const Group: Story = {
  render: () => <SettingsGroup />,
};
