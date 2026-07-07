import { Check } from 'lucide-react';
import './StepIndicator.scss';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="step-indicator">
      {steps.map((label, index) => {
        const status = index < currentStep ? 'completed' : index === currentStep ? 'active' : 'upcoming';

        const lineIsCompleted = index <= currentStep;

        return (
          <div className="step-indicator__step" key={label}>
            {index > 0 && (
              <div
                className={`step-indicator__line step-indicator__line--${lineIsCompleted ? 'completed' : 'upcoming'}`}
              />
            )}
            <div className="step-indicator__item">
              <div className={`step-indicator__circle step-indicator__circle--${status}`}>
                {status === 'completed' ? <Check size={14} /> : index + 1}
              </div>
              <span className="step-indicator__label">{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StepIndicator;
