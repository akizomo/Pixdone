import { useState } from 'react';
import { IconButton, PopoverMenu, PixelIcon } from '../design-system';
import { setBgmTrack, setBgmOn, setBgmVolume, getBgmVolume } from '../services/bgm';
import type { BgmTrack } from '../services/bgm';
import { playSound } from '../services/sound';
import './BgmControl.css';

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
    <div className="bgm-control__pos-1">
      {/* Trigger: BGM icon button */}
      {variant === 'zen' || variant === 'ghost' ? (
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={lang === 'ja' ? 'BGM設定' : 'BGM settings'}
          icon={<PixelIcon name={bgmOn ? 'music_note' : 'music_off'} size="16px" />}
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
          className={`bgm-control__trigger${bgmOn ? ' bgm-control__trigger--on' : ''}${open ? ' bgm-control__trigger--open' : ''}`}
        >
          <PixelIcon name={bgmOn ? 'music_note' : 'music_off'} size="16px" />
        </button>
      )}

      {/* Track picker + volume — DS PopoverMenu (items, outside-click, Escape) */}
      {open && (
        <PopoverMenu
          items={TRACKS.map((tr) => ({
            id: tr.id,
            label: lang === 'ja' ? tr.labelJa : tr.labelEn,
            selected: selected === tr.id,
            group: 'tracks',
          }))}
          onSelect={(id) => handleTrackSelect(id as TrackOption)}
          onClose={handleClose}
          align="right"
          footer={
            <div className={`bgm-control__volume${variant === 'zen' ? ' bgm-control__volume--zen' : ''}`}>
              <div className="bgm-control__text-1">
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
                className="bgm-control__box-1"
              />
            </div>
          }
        />
      )}
    </div>
  );
}
