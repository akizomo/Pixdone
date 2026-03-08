export interface TextareaProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  label?: string;
  helperText?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  resize?: 'none' | 'vertical' | 'auto';
  id?: string;
  className?: string;
}
