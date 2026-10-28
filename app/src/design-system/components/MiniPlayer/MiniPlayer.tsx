import { playSound } from '../../../services/sound';
import { PixelIcon } from '../PixelIcon/PixelIcon';
import type { MiniPlayerProps } from './MiniPlayer.types';
import './MiniPlayer.css';

/**
 * Persistent mini controller docked above the mobile bottom navigation while something
 * (e.g. the focus timer) keeps running on another screen — like a music app's mini player.
 * Tapping the title/time opens the full screen; `actions` hold the inline controls.
 *
 * While visible, set `data-mini-player="true"` on the app body so floating elements
 * (FAB) and the scroll area make room via `--pd-mini-player-offset`.
 */
export function MiniPlayer({
  title,
  time,
  openLabel,
  onOpen,
  actions,
  navHidden = false,
  soundKey = 'buttonClick',
  className = '',
  ...rest
}: MiniPlayerProps) {
  return (
    <div className={['pxd-mini-player', navHidden && 'pxd-mini-player--nav-hidden', className].filter(Boolean).join(' ')} role="region" aria-label={title} {...rest}>
      <button
        type="button"
        className="pxd-mini-player__main"
        aria-label={openLabel}
        onClick={() => {
          if (soundKey) playSound(soundKey);
          onOpen();
        }}
      >
        <PixelIcon name="timer" size="md" />
        <span className="pxd-mini-player__title">{title}</span>
        <span className="pxd-mini-player__time" aria-live="off">{time}</span>
      </button>
      {actions ? <div className="pxd-mini-player__actions">{actions}</div> : null}
    </div>
  );
}
