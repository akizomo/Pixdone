import { useState, type ReactNode } from 'react';
import { TopAppBar, type TopAppBarPlatform } from '../design-system';
import './SubPageLayout.css';

interface SubPageLayoutProps {
  title: ReactNode;
  isJa: boolean;
  onBack: () => void;
  /** Trailing actions in the bar. */
  actions?: ReactNode;
  /** Class for the root (e.g. to present it as a full-screen overlay). */
  className?: string;
  /** Class for the scrolling body (the page's own column layout). */
  bodyClassName?: string;
  /** Override platform detection (Storybook / tests). */
  platform?: TopAppBarPlatform;
  children: ReactNode;
}

/**
 * Full-page sub screen (account, pricing, feedback): a fixed TopAppBar above a scrolling body.
 * The bar is outside the scroll container, so it never moves (no rubber-band, no scroll-away) —
 * iOS navigation bar on iOS, Material 3 top app bar elsewhere.
 */
export function SubPageLayout({
  title, isJa, onBack, actions, className = '', bodyClassName = '', platform, children,
}: SubPageLayoutProps) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div className={['pd-subpage', className].filter(Boolean).join(' ')}>
      <TopAppBar
        title={title}
        onBack={onBack}
        backLabel={isJa ? '戻る' : 'Back'}
        backAriaLabel={isJa ? '戻る' : 'Back'}
        actions={actions}
        platform={platform}
        sticky={false}
        scrolled={scrolled}
      />
      <div
        className={['pd-subpage__body', bodyClassName].filter(Boolean).join(' ')}
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}
      >
        {children}
      </div>
    </div>
  );
}
