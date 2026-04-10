import { playSound } from '../../../services/sound';
import type { CheckboxProps } from './Checkbox.types';
import './Checkbox.css';

const sizeMap = { sm: 'pxd-checkbox--sm', md: 'pxd-checkbox--md' } as const;

export function Checkbox({
  checked,
  onChange,
  size = 'md',
  soundKey = 'taskComplete',
  className = '',
  ...rest
}: CheckboxProps) {
  const classes = [
    'pxd-checkbox',
    sizeMap[size],
    checked ? 'pxd-checkbox--checked' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      className={classes}
      onClick={() => {
        if (soundKey) playSound(soundKey);
        onChange(!checked);
      }}
      {...rest}
    >
      {/* Always rendered to prevent layout shift; hidden via opacity */}
      <span className="material-icons pxd-checkbox__check" aria-hidden="true">check</span>
    </button>
  );
}
