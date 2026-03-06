import { Button } from '../design-system';

export interface TutorialPanelProps {
  headline: string;
  subtext: string;
  buttonLabel: string;
  onSignUp: () => void;
}

export function TutorialPanel({ headline, subtext, buttonLabel, onSignUp }: TutorialPanelProps) {
  return (
    <div className="p-6 text-center rounded-none border-2 border-[var(--pd-color-accent-default)] bg-[var(--pd-color-background-elevated)] pd-shadow-md pd-pixel-ui">
      <p className="text-lg font-bold text-[var(--pd-color-text-primary)] mb-2 pd-font-pixel">{headline}</p>
      <p className="text-[var(--pd-color-text-secondary)] mb-4 text-[1rem] leading-[1.4]" style={{ fontFamily: 'var(--pd-font-brand)' }}>{subtext}</p>
      <Button variant="primary" onClick={onSignUp}>
        {buttonLabel}
      </Button>
    </div>
  );
}
