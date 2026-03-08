export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Tab bar variant */
  variant?: 'underline' | 'pill';
  className?: string;
  children?: React.ReactNode;
}

export interface TabPanelProps {
  id: string;
  activeId: string;
  children: React.ReactNode;
  className?: string;
}
