export interface ListItemProps {
  /** Primary label */
  label: string;
  /** Secondary metadata */
  description?: string;
  /** Leading element (avatar, icon, checkbox visual) */
  leading?: React.ReactNode;
  /** Trailing element (badge, action, chevron) */
  trailing?: React.ReactNode;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}
