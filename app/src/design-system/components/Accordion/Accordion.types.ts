export interface AccordionItem {
  id: string;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple open at once */
  multiple?: boolean;
  /** Default open item id(s) */
  defaultOpen?: string | string[];
  className?: string;
}
