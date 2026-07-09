import { useNavigate } from 'react-router-dom';
import SetupWizardLayout from './SetupWizardLayout';
import { useOnboarding } from '../../context/OnboardingContext';
import { languageLabel } from '../../data/languages';
import { modeLabel } from '../../utils/modeLabel';
import './ConfirmStep.scss';

function ConfirmStep() {
  const navigate = useNavigate();
  const { mode, spokenLanguage, targetLanguage, microphoneLabel, speakerLabel } = useOnboarding();

  return (
    <SetupWizardLayout
      currentStep={2}
      backTo="/setup/audio"
      onNext={() => navigate('/session')}
      nextLabel="セッションを開始"
    >
      <div className="confirm-step">
        <div className="confirm-step__row">
          <span className="confirm-step__key">モード</span>
          <span className="confirm-step__value">{modeLabel(mode)}</span>
        </div>
        <div className="confirm-step__row">
          <span className="confirm-step__key">言語</span>
          <span className="confirm-step__value">
            {languageLabel(spokenLanguage)} → {languageLabel(targetLanguage)}
          </span>
        </div>
        <div className="confirm-step__row">
          <span className="confirm-step__key">マイク</span>
          <span className="confirm-step__value">{microphoneLabel}</span>
        </div>
        <div className="confirm-step__row">
          <span className="confirm-step__key">スピーカー</span>
          <span className="confirm-step__value">{speakerLabel}</span>
        </div>
      </div>
    </SetupWizardLayout>
  );
}

export default ConfirmStep;
