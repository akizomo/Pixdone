import { type CSSProperties, memo } from 'react';
import './PixelIcon.css';

// Import all needed pixelarticons as raw SVG strings.
// Vite's `?raw` suffix returns the file contents as a string.
import addSvg from 'pixelarticons/svg/plus.svg?raw';
import archiveSvg from 'pixelarticons/svg/archive.svg?raw';
import arrowBackSvg from 'pixelarticons/svg/arrow-left.svg?raw';
import arrowDownwardSvg from 'pixelarticons/svg/arrow-down.svg?raw';
import arrowDropDownSvg from 'pixelarticons/svg/chevron-down.svg?raw';
import arrowUpwardSvg from 'pixelarticons/svg/arrow-up.svg?raw';
import autoAwesomeSvg from 'pixelarticons/svg/sparkles.svg?raw';
import calendarTodaySvg from 'pixelarticons/svg/calendar.svg?raw';
import chatBubbleOutlineSvg from 'pixelarticons/svg/message.svg?raw';
import checkSvg from 'pixelarticons/svg/check.svg?raw';
// pixelarticons has no plain ✕ icon (cancel.svg is a circle-slash ⊘),
// so we define a pixel-art × inline, matching the 24×24 / 2px-block grid style.
const closeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">' +
  '<path d="M5 5h2v2H5zM7 7h2v2H7zM9 9h2v2H9zM11 11h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM17 17h2v2h-2z' +
  'M17 5h2v2h-2zM15 7h2v2h-2zM13 9h2v2h-2zM9 13h2v2H9zM7 15h2v2H7zM5 17h2v2H5z"/></svg>';
import contentCopySvg from 'pixelarticons/svg/copy.svg?raw';
import darkModeSvg from 'pixelarticons/svg/moon.svg?raw';
import deleteSvg from 'pixelarticons/svg/delete.svg?raw';
import desktopWindowsSvg from 'pixelarticons/svg/monitor.svg?raw';
import driveFileMoveParens from 'pixelarticons/svg/folder.svg?raw';
import editSvg from 'pixelarticons/svg/pen-square.svg?raw';
import emojiEventsSvg from 'pixelarticons/svg/trophy.svg?raw';
import favoriteSvg from 'pixelarticons/svg/heart.svg?raw';
import folderSvg from 'pixelarticons/svg/folder.svg?raw';
import formatListBulletedSvg from 'pixelarticons/svg/bulletlist.svg?raw';
import fullscreenSvg from 'pixelarticons/svg/expand.svg?raw';
import languageSvg from 'pixelarticons/svg/globe.svg?raw';
import lightModeSvg from 'pixelarticons/svg/lightbulb.svg?raw';
import logoutSvg from 'pixelarticons/svg/logout.svg?raw';
import moreVertSvg from 'pixelarticons/svg/more-vertical.svg?raw';
import musicNoteSvg from 'pixelarticons/svg/music.svg?raw';
import musicOffSvg from 'pixelarticons/svg/volume.svg?raw';
import paletteSvg from 'pixelarticons/svg/image.svg?raw';
import personSvg from 'pixelarticons/svg/user.svg?raw';
import removeSvg from 'pixelarticons/svg/minus.svg?raw';
import repeatSvg from 'pixelarticons/svg/repeat.svg?raw';
import settingsSvg from 'pixelarticons/svg/settings-cog.svg?raw';
import sortVertSvg from 'pixelarticons/svg/sort-vertical.svg?raw';
import timerSvg from 'pixelarticons/svg/clock.svg?raw';
import visibilitySvg from 'pixelarticons/svg/eye.svg?raw';
import visibilityOffSvg from 'pixelarticons/svg/eye-off.svg?raw';
import volumeOffSvg from 'pixelarticons/svg/volume.svg?raw';
import volumeUpSvg from 'pixelarticons/svg/volume-3.svg?raw';
import flagSvg from 'pixelarticons/svg/flag.svg?raw';
import chevronRight2Svg from 'pixelarticons/svg/chevron-right-2.svg?raw';

/**
 * Maps Material Icons names → pixelarticons raw SVG strings.
 * Not every name is a 1:1 match, but the meaning is close enough.
 */
const ICON_MAP: Record<string, string> = {
  add: addSvg,
  archive: archiveSvg,
  arrow_back: arrowBackSvg,
  arrow_downward: arrowDownwardSvg,
  arrow_drop_down: arrowDropDownSvg,
  arrow_upward: arrowUpwardSvg,
  auto_awesome: autoAwesomeSvg,
  calendar_today: calendarTodaySvg,
  chat_bubble_outline: chatBubbleOutlineSvg,
  check: checkSvg,
  close: closeSvg,
  content_copy: contentCopySvg,
  dark_mode: darkModeSvg,
  delete: deleteSvg,
  desktop_windows: desktopWindowsSvg,
  drive_file_move: driveFileMoveParens,
  edit: editSvg,
  emoji_events: emojiEventsSvg,
  favorite: favoriteSvg,
  folder: folderSvg,
  format_list_bulleted: formatListBulletedSvg,
  fullscreen: fullscreenSvg,
  language: languageSvg,
  light_mode: lightModeSvg,
  logout: logoutSvg,
  more_vert: moreVertSvg,
  music_note: musicNoteSvg,
  music_off: musicOffSvg,
  palette: paletteSvg,
  person: personSvg,
  remove: removeSvg,
  repeat: repeatSvg,
  settings: settingsSvg,
  swap_vert: sortVertSvg,
  timer: timerSvg,
  visibility: visibilitySvg,
  visibility_off: visibilityOffSvg,
  volume_off: volumeOffSvg,
  volume_up: volumeUpSvg,
  flag: flagSvg,
  chevron_right_2: chevronRight2Svg,
};

export interface PixelIconProps {
  /** Material Icons name (e.g. "close", "delete") */
  name: string;
  /** CSS font-size style — controls the icon size (default: 1em, inherits parent) */
  size?: string | number;
  className?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * Renders a pixelarticons SVG inline so it inherits `color` from its parent
 * via `fill="currentColor"`. Drop-in replacement for `<span class="material-icons">`.
 */
export const PixelIcon = memo(function PixelIcon({
  name,
  size,
  className,
  style,
  'aria-hidden': ariaHidden,
}: PixelIconProps) {
  const raw = ICON_MAP[name];
  if (!raw) {
    if (import.meta.env.DEV) {
      console.warn(`[PixelIcon] Unknown icon name: "${name}"`);
    }
    return null;
  }

  const mergedStyle: CSSProperties = {
    ...style,
    ...(size != null ? { fontSize: typeof size === 'number' ? `${size}px` : size } : {}),
  };

  return (
    <span
      className={`pxd-pixel-icon${className ? ` ${className}` : ''}`}
      style={mergedStyle}
      aria-hidden={ariaHidden ?? true}
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  );
});
