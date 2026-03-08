export type CardVariant = 'default' | 'raised' | 'outlined' | 'pixel';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Makes card interactive (adds hover/press states) */
  interactive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section' | 'li';
}

export interface CardHeaderProps { children: React.ReactNode; className?: string; }
export interface CardBodyProps { children: React.ReactNode; className?: string; }
export interface CardFooterProps { children: React.ReactNode; className?: string; }
