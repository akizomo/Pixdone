export interface NavAction {
  icon?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  'aria-label': string;
}

export interface NavigationBarProps {
  /** Page title */
  title?: string;
  /** Left action (back button) */
  leading?: NavAction;
  /** Right actions */
  trailing?: NavAction[];
  /** Transparent background */
  transparent?: boolean;
  className?: string;
}
