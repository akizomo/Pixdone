export interface ToggleProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Called when the user clicks the toggle */
  onChange: (checked: boolean) => void;
  /** Accessible label (required for screen readers) */
  label?: string;
  /** Show label text next to the toggle */
  showLabel?: boolean;
  disabled?: boolean;
  className?: string;
}
