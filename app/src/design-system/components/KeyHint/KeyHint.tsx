import type { ReactNode } from 'react';
import './KeyHint.css';

export interface KeyHintProps {
  children: ReactNode;
  className?: string;
}

export function KeyHint({ children, className = '' }: KeyHintProps) {
  return (
    <kbd className={`pxd-kbd ${className}`.trim()} aria-hidden="true">
      {children}
    </kbd>
  );
}
