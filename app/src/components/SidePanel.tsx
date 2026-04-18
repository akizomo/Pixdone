import type { List } from '../types/list';
import { PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import './SidePanel.css';

export type SidePanelView = 'today' | 'plan' | 'smash' | string; // string = listId

export interface SidePanelProps {
  lists: List[];
  activeView: SidePanelView;
  onSelectView: (view: SidePanelView) => void;
  onAddList: () => void;
  onClose?: () => void;
  lang: 'en' | 'ja';
  todayCount: number;
  planCount: number;
  open?: boolean;
}

export function SidePanel({
  lists,
  activeView,
  onSelectView,
  onAddList,
  onClose,
  lang,
  todayCount,
  planCount,
  open = true,
}: SidePanelProps) {
  const normalLists = lists.filter(
    (l) => l.id !== 'smash-list' && l.name !== '💥 Smash List',
  );
  const smashList = lists.find(
    (l) => l.id === 'smash-list' || l.name === '💥 Smash List',
  );

  const navItem = (
    key: string,
    label: string,
    icon: string,
    count?: number,
  ) => {
    const isActive = activeView === key;
    return (
      <button
        key={key}
        type="button"
        className={`pd-sidebar__item${isActive ? ' pd-sidebar__item--active' : ''}`}
        onClick={() => { playSound('buttonClick'); onSelectView(key); }}
      >
        <PixelIcon name={icon} size="16px" />
        <span className="pd-sidebar__item-label">{label}</span>
        {count !== undefined && count > 0 && (
          <span className="pd-sidebar__item-count">{count}</span>
        )}
      </button>
    );
  };

  return (
    <>
    {/* Backdrop for drawer mode (narrow desktop) */}
    <div
      className={`pd-sidebar-backdrop${open ? '' : ' pd-sidebar-backdrop--hidden'}`}
      onClick={onClose}
      aria-hidden="true"
    />
    <aside className={`pd-sidebar${open ? '' : ' pd-sidebar--closed'}`} aria-label="Navigation">
      {/* Drawer header — logo + close */}
      <div className="pd-sidebar__header">
        <span className="pd-sidebar__logo">PixDone</span>
        <button
          type="button"
          className="pd-sidebar__close"
          onClick={() => { playSound('buttonClick'); onClose?.(); }}
          aria-label="Close"
        >
          <PixelIcon name="menu" size="20px" />
        </button>
      </div>
      {/* Views */}
      <div className="pd-sidebar__section">
        {navItem('today', lang === 'ja' ? '今日' : 'Today', 'calendar_today', todayCount)}
        {navItem('plan', 'Plan', 'format_list_bulleted', planCount)}
        {smashList && navItem('smash', '💥 Smash', 'close')}
      </div>

      {/* Lists */}
      <div className="pd-sidebar__section">
        <div className="pd-sidebar__section-header">
          {lang === 'ja' ? 'リスト' : 'Lists'}
        </div>
        {normalLists.map((list) => {
          const active = list.tasks.filter((t) => !t.completed).length;
          return navItem(list.id, list.name, 'folder', active);
        })}
        <button
          type="button"
          className="pd-sidebar__item pd-sidebar__item--add"
          onClick={() => { playSound('taskAdd'); onAddList(); }}
        >
          <PixelIcon name="add" size="16px" />
          <span className="pd-sidebar__item-label">
            {lang === 'ja' ? '新しいリスト' : 'New list'}
          </span>
        </button>
      </div>

    </aside>
    </>
  );
}
