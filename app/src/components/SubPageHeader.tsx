import type { ReactNode } from 'react';
import { TopAppBar, type TopAppBarPlatform } from '../design-system';
import './SubPageHeader.css';

interface SubPageHeaderProps {
  title: ReactNode;
  isJa: boolean;
  onBack: () => void;
  /** Trailing actions. */
  actions?: ReactNode;
  /** Override platform detection (Storybook / tests). */
  platform?: TopAppBarPlatform;
}

/**
 * Header for full-page sub screens (account, pricing, feedback).
 * Sticky TopAppBar — iOS navigation bar on iOS, Material 3 top app bar elsewhere.
 */
export function SubPageHeader({ title, isJa, onBack, actions, platform }: SubPageHeaderProps) {
  return (
    <TopAppBar
      className="pd-subpage-header"
      title={title}
      onBack={onBack}
      backLabel={isJa ? '戻る' : 'Back'}
      backAriaLabel={isJa ? '戻る' : 'Back'}
      actions={actions}
      platform={platform}
    />
  );
}

interface DetailViewHeaderProps {
  title: ReactNode;
  isJa: boolean;
  onBack: () => void;
  /** Right-aligned content (rarity, toggles, ...). */
  children?: ReactNode;
  /** Override platform detection (Storybook / tests). */
  platform?: TopAppBarPlatform;
}

/**
 * Header for full-screen detail overlays (effect / theme detail); `children` sit on the trailing side.
 * The overlay is the screen, so the bar is not sticky and always shows its separator.
 */
export function DetailViewHeader({ title, isJa, onBack, children, platform }: DetailViewHeaderProps) {
  return (
    <TopAppBar
      className="pd-detail-header"
      title={title}
      onBack={onBack}
      backAriaLabel={isJa ? '戻る' : 'Back'}
      actions={children}
      platform={platform}
      sticky={false}
    />
  );
}
