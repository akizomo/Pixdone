import type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card.types';
import './Card.css';

export function Card({ variant = 'default', padding = 'none', interactive = false, onClick, children, className = '', as: Tag = 'div' }: CardProps) {
  const classes = [
    'pxd-card',
    `pxd-card--${variant}`,
    `pxd-card--pad-${padding}`,
    interactive ? 'pxd-card--interactive' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive && onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return <div className={['pxd-card__header', className].filter(Boolean).join(' ')}>{children}</div>;
}
export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={['pxd-card__body', className].filter(Boolean).join(' ')}>{children}</div>;
}
export function CardFooter({ children, className = '' }: CardFooterProps) {
  return <div className={['pxd-card__footer', className].filter(Boolean).join(' ')}>{children}</div>;
}
