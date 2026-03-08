import type { SkeletonProps } from './Skeleton.types';
import './Skeleton.css';

export function Skeleton({ variant = 'text', width, height, lines = 3, 'aria-label': ariaLabel = 'Loading…', className = '' }: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className="pxd-skeleton-group" role="status" aria-label={ariaLabel}>
        {Array.from({ length: lines }).map((_, i) => (
          <span key={i} className={['pxd-skeleton', 'pxd-skeleton--text', className].filter(Boolean).join(' ')} style={{ width: width || '100%' }} />
        ))}
      </div>
    );
  }

  return (
    <span
      className={['pxd-skeleton', `pxd-skeleton--${variant}`, className].filter(Boolean).join(' ')}
      role="status"
      aria-label={ariaLabel}
      style={{
        width: width || (variant === 'circle' ? 40 : '100%'),
        height: height || (variant === 'text' ? 14 : variant === 'circle' ? 40 : 120),
        display: 'block',
      }}
    />
  );
}
