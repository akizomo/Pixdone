import type { NavigationBarProps } from './NavigationBar.types';
import './NavigationBar.css';

export function NavigationBar({ title, leading, trailing = [], transparent = false, className = '' }: NavigationBarProps) {
  return (
    <header className={['pxd-nav-bar', transparent ? 'pxd-nav-bar--transparent' : '', className].filter(Boolean).join(' ')}>
      <div className="pxd-nav-bar__leading">
        {leading && (
          <button className="pxd-nav-action" onClick={leading.onClick} aria-label={leading['aria-label']}>
            {leading.icon || leading.label}
          </button>
        )}
      </div>
      {title && <h1 className="pxd-nav-bar__title">{title}</h1>}
      <div className="pxd-nav-bar__trailing">
        {trailing.map((action, i) => (
          <button key={i} className="pxd-nav-action" onClick={action.onClick} aria-label={action['aria-label']}>
            {action.icon || action.label}
          </button>
        ))}
      </div>
    </header>
  );
}
