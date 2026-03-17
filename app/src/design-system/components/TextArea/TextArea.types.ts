import type { TextareaHTMLAttributes, ChangeEvent } from 'react';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'defaultValue'> {
  label?: string;
  value?: string;
  defaultValue?: string;
  helperText?: string;
  errorText?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

