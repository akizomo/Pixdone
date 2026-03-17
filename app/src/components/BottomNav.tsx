import { t } from '../lib/i18n';

export type ActiveScreen = 'tasks' | 'focus';

export interface BottomNavProps {
  activeScreen: ActiveScreen;
  onSelect: (screen: ActiveScreen) => void;
  lang: 'en' | 'ja';
}

export function BottomNav({ activeScreen, onSelect, lang }: BottomNavProps) {
  const tabs: { id: ActiveScreen; icon: string; labelKey: string }[] = [
    { id: 'tasks', icon: 'format_list_bulleted', labelKey: 'tasks' },
    { id: 'focus', icon: 'timer', labelKey: 'focus' },
  ];

  return (
    <nav
      role="tablist"
      aria-label={lang === 'ja' ? 'メインナビゲーション' : 'Main navigation'}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(56px + env(safe-area-inset-bottom))',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'var(--pd-color-background-elevated)',
        borderTop: '2px solid var(--pd-color-border-default)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 200,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeScreen === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              background: 'none',
              border: 'none',
              borderTop: '3px solid transparent',
              color: isActive ? 'var(--pd-color-accent-default)' : 'var(--pd-color-text-secondary)',
              cursor: 'pointer',
              padding: '6px 0 4px',
              transition: 'color 0.15s',
              fontFamily: 'var(--pd-font-body)',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--pd-color-text-secondary)';
              }
            }}
          >
            <span className="material-icons" style={{ fontSize: '22px', lineHeight: 1 }}>
              {tab.icon}
            </span>
            <span style={{ fontSize: '0.625rem', fontWeight: isActive ? 600 : 400, lineHeight: 1 }}>
              {t(tab.labelKey, lang)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
