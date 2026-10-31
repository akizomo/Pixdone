import type { ReactNode } from 'react';
import { Button, IconButton, PixelIcon } from '../design-system';
import './SubPageHeader.css';

interface SubPageHeaderProps {
  title: ReactNode;
  isJa: boolean;
  onBack: () => void;
}

/** Back button + page title row shared by full-page sub screens (account, pricing, feedback). */
export function SubPageHeader({ title, isJa, onBack }: SubPageHeaderProps) {
  return (
    <div className="pd-subpage-header">
      <Button variant="ghost" size="sm" soundKey="taskCancel" onClick={onBack}>
        <PixelIcon name="arrow_back" size="sm" />
        {isJa ? 'もどる' : 'BACK'}
      </Button>
      <span className="pd-subpage-header__title">{title}</span>
    </div>
  );
}

interface DetailViewHeaderProps {
  title: ReactNode;
  isJa: boolean;
  onBack: () => void;
  /** Right-aligned content (rarity, toggles, ...). */
  children?: ReactNode;
}

/** Icon-only back button + title bar for full-screen detail overlays; `children` sit on the right. */
export function DetailViewHeader({ title, isJa, onBack, children }: DetailViewHeaderProps) {
  return (
    <div className="pd-detail-header">
      <IconButton
        variant="ghost"
        size="md"
        soundKey="taskCancel"
        aria-label={isJa ? '戻る' : 'Back'}
        icon={<PixelIcon name="arrow_back" size="md" />}
        onClick={onBack}
      />
      <span className="pd-detail-header__title">{title}</span>
      {children}
    </div>
  );
}
