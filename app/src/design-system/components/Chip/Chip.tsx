import { playSound } from '../../../services/sound';
import { PixelIconSizeContext } from '../PixelIcon/PixelIcon';
import type { ChipProps } from './Chip.types';
import './Chip.css';

const sizeMap = { sm: 'pxd-chip--sm', md: 'pxd-chip--md' } as const;
const variantMap = {
  neutral: 'pxd-chip--neutral',
  ghost: 'pxd-chip--ghost',
  accent: 'pxd-chip--accent',
  success: 'pxd-chip--success',
  warning: 'pxd-chip--warning',
  danger: 'pxd-chip--danger',
} as const;

export function Chip({
  variant = 'neutral',
  size = 'md',
  font = 'brand',
  selected = false,
  removable = false,
  onRemove,
  children,
  className = '',
  onClick,
  ...rest
}: ChipProps) {
  const classes = [
    'pxd-chip',
    sizeMap[size],
    variantMap[variant],
    font === 'body' ? 'pxd-chip--font-body' : '',
    selected ? 'pxd-chip--selected' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <PixelIconSizeContext.Provider value="sm">
      <span
        role={selected ? 'option' : undefined}
        aria-selected={selected ? true : undefined}
        className={classes}
        onClick={(e) => { playSound('buttonClick'); onClick?.(e); }}
        {...rest}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); playSound('taskCancel'); onRemove?.(); }}
            className="pxd-chip__remove"
            aria-label="Remove"
          >
            ×
          </button>
        )}
      </span>
    </PixelIconSizeContext.Provider>
  );
}
