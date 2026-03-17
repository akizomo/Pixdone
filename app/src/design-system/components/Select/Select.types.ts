import type { SelectHTMLAttributes, ChangeEvent } from 'react';

export type SelectSize = 'sm' | 'md';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue' | 'size'> {
  label?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  helperText?: string;
  errorText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  size?: SelectSize;
}
