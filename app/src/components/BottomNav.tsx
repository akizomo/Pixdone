import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PixelIcon } from '../design-system';
import './BottomNav.css';

export type ActiveScreen = 'tasks' | 'focus' | 'collection';

export interface BottomNavProps {
  activeScreen: ActiveScreen | null;
  onSelect: (screen: ActiveScreen) => void;
  lang: 'en' | 'ja';
  showCollection?: boolean;
}

export function BottomNav({ activeScreen, onSelect, lang, showCollection = true }: BottomNavProps) {
  const tabs: { id: ActiveScreen; icon: string; labelKey: string }[] = [
    { id: 'tasks', icon: 'format_list_bulleted', labelKey: 'tasks' },
    { id: 'focus', icon: 'timer', labelKey: 'focus' },
    { id: 'collection', icon: 'auto_awesome', labelKey: 'collection' },
  ];

  const visibleTabs = showCollection ? tabs : tabs.filter((t) => t.id !== 'collection');

  return (
    <nav
      role="tablist"
      className="pd-bottom-nav"
      aria-label={lang === 'ja' ? 'メインナビゲーション' : 'Main navigation'}
    >
      {visibleTabs.map((tab) => {
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`pd-bottom-nav__tab${isActive ? ' pd-bottom-nav__tab--active' : ''}`}
            onClick={() => { playSound('buttonClick'); onSelect(tab.id); }}
          >
            <PixelIcon name={tab.icon} className="pd-bottom-nav__icon" />
            <span className="pd-bottom-nav__label">{t(tab.labelKey, lang)}</span>
          </button>
        );
      })}
    </nav>
  );
}
