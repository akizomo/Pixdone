import { Button } from '../design-system';
import { playSound } from '../services/sound';
import './TutorialPanel.css';

export interface TutorialFeature {
  icon: string;
  label: string;
}

export interface TutorialPanelProps {
  headline: string;
  subtext: string;
  buttonLabel: string;
  onSignUp: () => void;
  pricingLabel?: string;
  onViewPricing?: () => void;
  freeFeatures?: TutorialFeature[];
  featuresLabel?: string;
}

export function TutorialPanel({ headline, subtext, buttonLabel, onSignUp, pricingLabel, onViewPricing, freeFeatures, featuresLabel }: TutorialPanelProps) {
  return (
    <div className="tutorial-complete-cta">
      <p className="tutorial-complete-cta-text">{headline}</p>
      {freeFeatures && freeFeatures.length > 0 ? (
        <div className="tutorial-feature-note">
          {featuresLabel && <p className="tutorial-feature-note-label">{featuresLabel}</p>}
          <ul className="tutorial-feature-list">
            {freeFeatures.map((f) => (
              <li key={f.label} className="tutorial-feature-item">
                <span className="tutorial-feature-icon">{f.icon}</span>{f.label}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="tutorial-complete-cta-sub">{subtext}</p>
      )}
      <div className="tutorial-panel__row-1">
        <Button variant="primary" onClick={() => { playSound('buttonClick'); onSignUp(); }}>
          {buttonLabel}
        </Button>
        {onViewPricing && pricingLabel && (
          <button
            type="button"
            onClick={() => { playSound('buttonClick'); onViewPricing(); }}
            className="tutorial-panel__text-1"
          >
            {pricingLabel}
          </button>
        )}
      </div>
    </div>
  );
}
