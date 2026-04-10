import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';
import type { SoundKey } from '../../foundations/sound.tokens';

export type TextLinkSize = 'sm' | 'md';

interface CommonProps {
  size?: TextLinkSize;
  children?: ReactNode;
  soundKey?: SoundKey;
  className?: string;
}

export type TextLinkButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    href?: never;
  };

export type TextLinkAnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
    href: string;
  };

export type TextLinkProps = TextLinkButtonProps | TextLinkAnchorProps;
