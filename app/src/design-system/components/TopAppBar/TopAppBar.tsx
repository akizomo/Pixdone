import { useEffect, useRef, useState } from 'react';
import { playSound } from '../../../services/sound';
import { IconButton } from '../IconButton/IconButton';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import { resolveTopAppBarPlatform } from './platform';
import type { TopAppBarProps } from './TopAppBar.types';
import './TopAppBar.css';

function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

/** True once the nearest scroll container has scrolled away from the top. */
function useScrolledUnder(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const scroller = findScrollParent(ref.current);
    if (!scroller) return;
    const update = () => setScrolled(scroller.scrollTop > 0);
    update();
    scroller.addEventListener('scroll', update, { passive: true });
    return () => scroller.removeEventListener('scroll', update);
  }, [ref, enabled]);
  return scrolled;
}

/**
 * Top app bar for sub pages and detail screens.
 * Follows Apple HIG (navigation bar) on iOS and Material 3 (small top app bar) elsewhere.
 */
export function TopAppBar({
  title,
  onBack,
  backLabel,
  backAriaLabel,
  actions,
  platform = 'auto',
  sticky = true,
  className = '',
  ...rest
}: TopAppBarProps) {
  const ref = useRef<HTMLElement>(null);
  const resolved = resolveTopAppBarPlatform(platform);
  const scrolled = useScrolledUnder(ref, sticky);

  const classes = [
    'pd-top-app-bar',
    `pd-top-app-bar--${resolved}`,
    sticky && 'pd-top-app-bar--sticky',
    scrolled && 'pd-top-app-bar--scrolled',
    className,
  ].filter(Boolean).join(' ');

  const back = onBack && (resolved === 'ios' ? (
    <button
      type="button"
      className="pd-top-app-bar__ios-back"
      aria-label={backAriaLabel}
      onClick={() => { playSound('taskCancel'); onBack(); }}
    >
      <PixelIcon name="chevron_left" size="md" />
      {backLabel && <span className="pd-top-app-bar__ios-back-label">{backLabel}</span>}
    </button>
  ) : (
    <IconButton
      variant="ghost"
      size="md"
      soundKey="taskCancel"
      className="pd-top-app-bar__nav"
      aria-label={backAriaLabel}
      icon={<PixelIcon name="arrow_back" size="md" />}
      onClick={onBack}
    />
  ));

  return (
    <header ref={ref} className={classes} data-platform={resolved} {...rest}>
      <div className="pd-top-app-bar__leading">{back}</div>
      <h1 className="pd-top-app-bar__title">{title}</h1>
      <div className="pd-top-app-bar__trailing">{actions}</div>
    </header>
  );
}
