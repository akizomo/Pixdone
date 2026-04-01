import { Button } from '../design-system';
import { playSound } from '../services/sound';

export interface TutorialPanelProps {
  headline: string;
  subtext: string;
  buttonLabel: string;
  onSignUp: () => void;
  pricingLabel?: string;
  onViewPricing?: () => void;
}

export function TutorialPanel({ headline, subtext, buttonLabel, onSignUp, pricingLabel, onViewPricing }: TutorialPanelProps) {
  return (
    <div className="tutorial-complete-cta">
      <p className="tutorial-complete-cta-text">{headline}</p>
      <p className="tutorial-complete-cta-sub">{subtext}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="primary" onClick={() => { playSound('buttonClick'); onSignUp(); }}>
          {buttonLabel}
        </Button>
        {onViewPricing && pricingLabel && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); onViewPricing(); }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--pd-font-body)',
              fontSize: '0.8125rem',
              color: 'var(--pd-color-text-secondary)',
              textDecoration: 'underline',
              padding: '4px 0',
            }}
          >
            {pricingLabel}
          </button>
        )}
      </div>
    </div>
  );
}
