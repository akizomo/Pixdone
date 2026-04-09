import type { HTMLAttributes } from 'react';

export type RichTextFieldSize = 'sm' | 'md';

export interface RichTextFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  label?: string;
  value?: string; // markdown-ish (supports [label](url))
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  size?: RichTextFieldSize;
  onChange?: (value: string) => void;
}

