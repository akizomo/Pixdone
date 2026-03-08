export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  /** Image src */
  src?: string;
  /** Alt text / display name (used for initials fallback) */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Shape variant */
  shape?: AvatarShape;
  /** Override initials (max 2 chars) */
  initials?: string;
  /** Pixel art aesthetic border */
  pixel?: boolean;
  className?: string;
}
