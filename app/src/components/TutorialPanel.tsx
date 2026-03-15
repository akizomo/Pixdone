import { Button } from '../design-system';
import { playSound } from '../services/sound';

export interface TutorialPanelProps {
  headline: string;
  subtext: string;
  buttonLabel: string;
  onSignUp: () => void;
}

export function TutorialPanel({ headline, subtext, buttonLabel, onSignUp }: TutorialPanelProps) {
  return (
    <div className="tutorial-complete-cta">
      <p className="tutorial-complete-cta-text">{headline}</p>
      <p className="tutorial-complete-cta-sub">{subtext}</p>
      <Button variant="signup" onClick={() => { playSound('buttonClick'); onSignUp(); }}>
        {buttonLabel}
      </Button>
    </div>
  );
}
