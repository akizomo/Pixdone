import { playSound } from '../../../services/sound';
import type { TextLinkProps } from './TextLink.types';
import './TextLink.css';

const sizeMap = { sm: 'pxd-text-link--sm', md: 'pxd-text-link--md' } as const;

export function TextLink(props: TextLinkProps) {
  const {
    size = 'md',
    children,
    soundKey = 'buttonClick',
    className = '',
    ...rest
  } = props;

  const classes = ['pxd-text-link', sizeMap[size], className]
    .filter(Boolean)
    .join(' ');

  if ('href' in props && props.href) {
    const { href, onClick, ...anchorRest } = rest as React.AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a
        href={props.href}
        className={classes}
        onClick={(e) => {
          if (soundKey) playSound(soundKey);
          (onClick as React.MouseEventHandler<HTMLAnchorElement>)?.(e);
        }}
        {...anchorRest}
      >
        {children}
      </a>
    );
  }

  const { onClick, ...buttonRest } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type="button"
      className={classes}
      onClick={(e) => {
        if (soundKey) playSound(soundKey);
        (onClick as React.MouseEventHandler<HTMLButtonElement>)?.(e);
      }}
      {...buttonRest}
    >
      {children}
    </button>
  );
}
