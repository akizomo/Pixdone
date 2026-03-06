import { IconButton } from '../design-system';

export interface ListHeaderProps {
  title: string;
  showMenu: boolean;
  onMenuClick?: () => void;
}

export function ListHeader({ title, showMenu, onMenuClick }: ListHeaderProps) {
  return (
    <div
      className="flex justify-between items-center mb-2"
      style={{
        padding: 'var(--pd-layout-listHeader-paddingVertical, 16px) var(--pd-layout-listHeader-paddingHorizontal, 20px)',
      }}
    >
      <h2 className="text-[1.375rem] font-bold text-[var(--pd-color-text-primary)] tracking-[1px] m-0 pd-font-pixel uppercase">
        {title}
      </h2>
      {showMenu && onMenuClick && (
        <IconButton
          icon={<span>⋮</span>}
          aria-label="List options"
          onClick={onMenuClick}
          size="sm"
        />
      )}
    </div>
  );
}
