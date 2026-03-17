import type { HTMLAttributes } from 'react';

export interface RichTextAreaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  label?: string;
  value?: string; // markdown-ish (supports [label](url))
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
  placeholder?: string;
  rows?: number; // used to approximate min-height
  onChange?: (value: string) => void;
}

