import type { InputHTMLAttributes, ChangeEvent } from 'react';

export type TextFieldType = 'text' | 'email' | 'password' | 'search';

export type TextFieldSize = 'sm' | 'md';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'defaultValue'> {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: TextFieldType;
  size?: TextFieldSize;
}
