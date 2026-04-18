import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PixelIcon } from '../design-system';
import './BottomNav.css';

export type MobileSubView = 'lists' | 'today' | 'plan';

export interface BottomNavProps {
  activeView: MobileSubView | null;
  onSelect: (view: MobileSubView) => void;
  lang: 'en' | 'ja';
  hidden?: boolean;
}

const TABS: { id: MobileSubView; icon: string; labelKey: string; fallback: string }[] = [
  { id: 'lists', icon: 'folder',              labelKey: 'lists', fallback: 'Lists' },
  { id: 'today', icon: 'calendar_today',      labelKey: 'today', fallback: 'Today' },
  { id: 'plan',  icon: 'format_list_bulleted', labelKey: 'plan',  fallback: 'Plan'  },
];

export function BottomNav({ activeView, onSelect, lang, hidden = false }: BottomNavProps) {
  return (
    <nav
      role="tablist"
      className={`pd-bottom-nav${hidden ? ' pd-bottom-nav--hidden' : ''}`}
      aria-label={lang === 'ja' ? 'タスクビュー切替' : 'Task view'}
    >
      {TABS.map((tab) => {
        const isActive = activeView === tab.id;
        const label = t(tab.labelKey, lang) || tab.fallback;
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
            <span className="pd-bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
