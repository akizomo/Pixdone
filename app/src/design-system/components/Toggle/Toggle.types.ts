export interface ToggleProps {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked (uncontrolled) */
  defaultChecked?: boolean;
  /** Change handler */
  onChange?: (checked: boolean) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Accessible label */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** ARIA label when no visible label */
  'aria-label'?: string;
  className?: string;
}
