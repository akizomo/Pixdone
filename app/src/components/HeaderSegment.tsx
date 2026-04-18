import { t } from '../lib/i18n';
import { playSound } from '../services/sound';
import { PixelIcon } from '../design-system';
import './HeaderSegment.css';

export type HeaderSegmentValue = 'tasks' | 'focus';

export interface HeaderSegmentProps {
  activeValue: HeaderSegmentValue | null;
  onSelect: (value: HeaderSegmentValue) => void;
  lang: 'en' | 'ja';
}

const ITEMS: { id: HeaderSegmentValue; icon: string; labelKey: string }[] = [
  { id: 'tasks', icon: 'format_list_bulleted', labelKey: 'tasks' },
  { id: 'focus', icon: 'timer', labelKey: 'focus' },
];

export function HeaderSegment({ activeValue, onSelect, lang }: HeaderSegmentProps) {
  return (
    <div className="pd-header-segment" role="tablist" aria-label={lang === 'ja' ? '画面切替' : 'Screen switch'}>
      {ITEMS.map((item) => {
        const isActive = activeValue === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={t(item.labelKey, lang)}
            title={t(item.labelKey, lang)}
            className={`pd-header-segment__tab${isActive ? ' pd-header-segment__tab--active' : ''}`}
            onClick={() => { playSound('buttonClick'); onSelect(item.id); }}
          >
            <PixelIcon name={item.icon} className="pd-header-segment__icon" />
          </button>
        );
      })}
    </div>
  );
}
