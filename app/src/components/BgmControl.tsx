import { useState } from 'react';
import { IconButton, PopoverMenu } from '../design-system';
import { setBgmTrack, setBgmOn, setBgmVolume, getBgmVolume } from '../services/bgm';
import type { BgmTrack } from '../services/bgm';
import { playSound } from '../services/sound';

export interface BgmControlProps {
  lang: 'en' | 'ja';
  bgmOn: boolean;
  track: BgmTrack;
  onChange: (next: { bgmOn: boolean; track: BgmTrack }) => void;
  onMenuOpenChange?: (open: boolean) => void;
  variant?: 'default' | 'ghost' | 'zen';
}

type TrackOption = BgmTrack | 'off';

const TRACKS: { id: TrackOption; labelEn: string; labelJa: string }[] = [
  { id: 'off',       labelEn: 'None',      labelJa: 'なし' },
  { id: 'retro',     labelEn: 'Retro',     labelJa: 'レトロ' },
  { id: 'synthwave', labelEn: 'Synthwave', labelJa: 'シンスウェーブ' },
  { id: 'chill',     labelEn: 'Chill',     labelJa: 'チル' },
  { id: 'rain',      labelEn: 'Rain',      labelJa: '雨' },
  { id: 'nightCity', labelEn: 'Night City', labelJa: '夜の街' },
];

export function BgmControl({ lang, bgmOn, track, onChange, onMenuOpenChange, variant = 'default' }: BgmControlProps) {
  const [open, setOpen]   = useState(false);
  const [vol, setVol]     = useState(() => Math.round(getBgmVolume() * 100));

  const selected: TrackOption = bgmOn ? track : 'off';

  const handleTrackSelect = (opt: TrackOption) => {
    playSound('buttonClick');
    if (opt === 'off') {
      setBgmOn(false);
      onChange({ bgmOn: false, track });
    } else {
      setBgmTrack(opt);
      setBgmOn(true);
      onChange({ bgmOn: true, track: opt });
    }
  };

  const handleVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVol(v);
    setBgmVolume(v / 100);
  };

  const handleClose = () => {
    playSound('taskCancel');
    setOpen(false);
    onMenuOpenChange?.(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger: BGM icon button */}
      {variant === 'zen' || variant === 'ghost' ? (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={lang === 'ja' ? 'BGM設定' : 'BGM settings'}
          icon={<span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>{bgmOn ? 'music_note' : 'music_off'}</span>}
          onClick={() => {
            setOpen((v) => {
              const next = !v;
              onMenuOpenChange?.(next);
              return next;
            });
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            playSound('buttonClick');
            setOpen((v) => {
              const next = !v;
              onMenuOpenChange?.(next);
              return next;
            });
          }}
          aria-label={lang === 'ja' ? 'BGM設定' : 'BGM settings'}
          aria-expanded={open}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            background: open ? 'var(--pd-color-background-hover)' : 'var(--pd-color-background-elevated)',
            border: '2px solid var(--pd-color-border-default)',
            color: bgmOn ? 'var(--pd-color-text-primary)' : 'var(--pd-color-text-secondary)',
            cursor: 'pointer',
            boxShadow: '2px 2px 0 var(--pd-color-shadow-default)',
            transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease',
            flexShrink: 0,
            imageRendering: 'pixelated',
          }}
        >
          <span className="material-icons" style={{ fontSize: '16px', lineHeight: 1 }}>
            {bgmOn ? 'music_note' : 'music_off'}
          </span>
        </button>
      )}

      {/* Popover menu — uses DS PopoverMenu for consistent outside-click + Escape */}
      {open && (
        <PopoverMenu
          items={[]}
          onSelect={() => {}}
          onClose={handleClose}
          align="right"
        >
          {/* Track list */}
          <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {TRACKS.map(tr => {
              const isActive = selected === tr.id;
              return (
                <button
                  key={tr.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleTrackSelect(tr.id)}
                  className={`pxd-popover-menu__item${isActive ? ' pxd-popover-menu__item--active' : ''}`}
                  style={{
                    background: isActive ? 'var(--pd-color-background-hover)' : undefined,
                    border: 'none',
                    borderBottom: 'none',
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '14px', lineHeight: 1, color: 'var(--pd-color-accent-default)', opacity: isActive ? 1 : 0 }}>
                    check
                  </span>
                  {lang === 'ja' ? tr.labelJa : tr.labelEn}
                </button>
              );
            })}
          </div>

          {/* Volume slider */}
          <div style={{
            borderTop: variant === 'zen' ? 'none' : '1px solid var(--pd-color-border-default)',
            padding: '10px 14px 8px',
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
                onPointerDown={() => playSound('buttonClick')}
                style={{
                  width: '100%',
                  accentColor: 'var(--pd-color-accent-default)',
                  cursor: 'pointer',
                }}
              />
          </div>
        </PopoverMenu>
      )}
    </div>
  );
}
