import type { TabBarProps } from './TabBar.types';
import './TabBar.css';

export function TabBar({ items, activeId, onChange, className = '' }: TabBarProps) {
  return (
    <nav
      className={['pxd-tab-bar', className].filter(Boolean).join(' ')}
      aria-label="Bottom navigation"
    >
      {items.map(({ id, label, icon, badge, disabled }) => (
        <button
          key={id}
          className={['pxd-tab-bar__item', activeId === id ? 'pxd-tab-bar__item--active' : ''].filter(Boolean).join(' ')}
          onClick={() => !disabled && onChange(id)}
          disabled={disabled}
          aria-label={badge ? `${label}, ${badge} notifications` : label}
          aria-current={activeId === id ? 'page' : undefined}
        >
          <span className="pxd-tab-bar__icon" aria-hidden="true">
            {icon}
            {!!badge && badge > 0 && <span className="pxd-tab-bar__badge">{badge > 99 ? '99+' : badge}</span>}
          </span>
          <span className="pxd-tab-bar__label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
