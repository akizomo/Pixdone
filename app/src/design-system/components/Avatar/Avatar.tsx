import { useState } from 'react';
import type { AvatarProps } from './Avatar.types';
import './Avatar.css';

function getInitials(name?: string, initials?: string): string {
  if (initials) return initials.slice(0, 2).toUpperCase();
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ src, name, size = 'md', shape = 'circle', initials, pixel = false, className = '' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const classes = [
    'pxd-avatar',
    `pxd-avatar--${size}`,
    `pxd-avatar--${shape}`,
    pixel ? 'pxd-avatar--pixel' : '',
    className,
  ].filter(Boolean).join(' ');

  const label = name || initials || 'User avatar';

  return (
    <div className={classes} role="img" aria-label={label}>
      {src && !imgError ? (
        <img className="pxd-avatar__img" src={src} alt={label} onError={() => setImgError(true)} />
      ) : (
        <span aria-hidden="true">{getInitials(name, initials)}</span>
      )}
    </div>
  );
}
