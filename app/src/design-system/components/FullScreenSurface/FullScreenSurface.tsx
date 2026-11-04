import type { FullScreenSurfaceProps } from './FullScreenSurface.types';
import './FullScreenSurface.css';

/**
 * Full-screen layer for the edge-to-edge native app.
 *
 * The outer element covers the whole screen (background shows behind the status
 * bar and home indicator); children live in an inner box inset by the safe area.
 * Absolutely positioned children (close buttons etc.) are placed relative to that
 * box, so `top: var(--pd-space-3)` already lands below the status bar.
 *
 * Props other than `innerClassName` go to the outer element (role, aria-*, data-*).
 */
export function FullScreenSurface({ className, innerClassName, children, ...rest }: FullScreenSurfaceProps) {
  return (
    <div className={['pxd-fullscreen', className].filter(Boolean).join(' ')} {...rest}>
      <div className={['pxd-fullscreen__safe', innerClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}
