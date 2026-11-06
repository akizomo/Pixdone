import { PixelIcon } from '../design-system';
import { playSound } from '../services/sound';
import './OnboardingTourChoices.css';

export interface OnboardingTourChoicesProps {
  lang: 'en' | 'ja';
  /** Opens the Reminders import sheet (also ends the tour). */
  onImportReminders: () => void;
}

/**
 * Onboarding first-task step, iOS app only: turns the lone "+" FAB into a two-way
 * choice — "Write it yourself" (the FAB, labelled here) or "Import from Reminders"
 * (a same-size round button stacked above it). Both sit above the tour overlay.
 */
export function OnboardingTourChoices({ lang, onImportReminders }: OnboardingTourChoicesProps) {
  const ja = lang === 'ja';
  return (
    <>
      <button
        type="button"
        className="pd-tour-choice pd-tour-choice--import"
        onClick={() => { playSound('buttonClick'); onImportReminders(); }}
      >
        <span className="pd-tour-choice__label">{ja ? 'リマインダーから取り込む' : 'Import from Reminders'}</span>
        <span className="pd-tour-choice__circle" aria-hidden="true">
          <PixelIcon name="arrow_downward" size="24px" />
        </span>
      </button>
      {/* Label only: the real FAB next to it handles the tap. */}
      <span className="pd-tour-choice pd-tour-choice--write" aria-hidden="true">
        <span className="pd-tour-choice__label">{ja ? '自分で書く' : 'Write it yourself'}</span>
      </span>
    </>
  );
}
