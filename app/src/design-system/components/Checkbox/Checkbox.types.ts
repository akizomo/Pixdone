export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  /** Helper text below label */
  description?: string;
  'aria-label'?: string;
  id?: string;
  className?: string;
}
