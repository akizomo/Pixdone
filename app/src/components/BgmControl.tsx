import { useState, useRef, useEffect } from 'react';
import { setBgmTrack, setBgmOn, setBgmVolume, getBgmTrack, getBgmVolume, isBgmOn } from '../services/bgm';
import type { BgmTrack } from '../services/bgm';

export interface BgmControlProps {
  lang: 'en' | 'ja';
  focusRunning: boolean;
}

type TrackOption = BgmTrack | 'off';

const TRACKS: { id: TrackOption; labelEn: string; labelJa: string }[] = [
  { id: 'off',       labelEn: 'None',      labelJa: 'なし' },
  { id: 'retro',     labelEn: 'Retro',     labelJa: 'レトロ' },
  { id: 'synthwave', labelEn: 'Synthwave', labelJa: 'シンスウェーブ' },
  { id: 'chill',     labelEn: 'Chill',     labelJa: 'チル' },
];

export function BgmControl({ lang }: BgmControlProps) {
  const [open, setOpen]   = useState(false);
  const [on, setOn]       = useState(isBgmOn);
  const [track, setTrack] = useState<BgmTrack>(getBgmTrack);
  const [vol, setVol]     = useState(() => Math.round(getBgmVolume() * 100));
  const wrapRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected: TrackOption = on ? track : 'off';

  const handleTrackSelect = (opt: TrackOption) => {
    if (opt === 'off') {
      setOn(false);
      setBgmOn(false);
    } else {
      setOn(true);
      setTrack(opt);
      setBgmTrack(opt);
      setBgmOn(true);
    }
  };

  const handleVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVol(v);
    setBgmVolume(v / 100);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger: BGM icon button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={lang === 'ja' ? 'BGM設定' : 'BGM settings'}
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          background: open ? 'var(--pxd-color-action-ghost-hover)' : 'none',
          border: '2px solid',
          borderColor: 'var(--pxd-color-border-interactive)',
          color: on ? 'var(--pxd-color-text-primary)' : 'var(--pxd-color-text-tertiary)',
          cursor: 'pointer',
          transition: 'background var(--pxd-motion-fast) var(--pxd-easing-standard), border-color var(--pxd-motion-fast) var(--pxd-easing-standard), color var(--pxd-motion-fast) var(--pxd-easing-standard)',
          flexShrink: 0,
        }}
      >
        <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>
          {on ? 'music_note' : 'music_off'}
        </span>
      </button>

      {/* Popover menu */}
      {open && (
        <div
          role="dialog"
          aria-label={lang === 'ja' ? 'BGM設定' : 'BGM settings'}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 500,
            background: 'var(--pxd-color-surface-raised)',
            border: '2px solid var(--pxd-color-border-outline)',
            boxShadow: 'var(--pxd-shadow-soft-md)',
            padding: '12px',
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {/* Track list */}
          {TRACKS.map(tr => {
            const isActive = selected === tr.id;
            return (
              <button
                key={tr.id}
                type="button"
                onClick={() => handleTrackSelect(tr.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: isActive ? 'var(--pxd-color-action-ghost-hover)' : 'none',
                  border: 'none',
                  color: 'var(--pxd-color-text-primary)',
                  fontFamily: 'var(--pxd-font-body)',
                  fontSize: 'var(--pxd-font-size-sm)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background var(--pxd-motion-fast) var(--pxd-easing-standard)',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--pxd-color-action-ghost-hover)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'none';
                }}
              >
                <span className="material-icons" style={{ fontSize: '14px', lineHeight: 1, color: 'var(--pxd-color-action-primary)', opacity: isActive ? 1 : 0 }}>
                  check
                </span>
                {lang === 'ja' ? tr.labelJa : tr.labelEn}
              </button>
            );
          })}

          {/* Volume slider — always visible */}
          <div style={{
            borderTop: '1px solid var(--pd-color-border-default)',
            marginTop: '4px',
            paddingTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--pd-font-body)',
                fontSize: '0.6875rem',
                color: 'var(--pd-color-text-secondary)',
              }}>
                <span>{lang === 'ja' ? 'ボリューム' : 'Volume'}</span>
                <span>{vol}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={vol}
                onChange={handleVol}
                style={{
                  width: '100%',
                  accentColor: 'var(--pd-color-accent-default)',
                  cursor: 'pointer',
                }}
              />
          </div>
        </div>
      )}
    </div>
  );
}
