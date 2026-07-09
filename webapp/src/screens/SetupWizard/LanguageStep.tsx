import { useNavigate } from 'react-router-dom';
import SetupWizardLayout from './SetupWizardLayout';
import FormSelect from '../../components/common/FormSelect';
import { useOnboarding } from '../../context/OnboardingContext';
import { quickAccessLanguages, remainingLanguages } from '../../data/languages';

function LanguageOptions() {
  return (
    <>
      {quickAccessLanguages.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
      <option disabled>──────</option>
      {remainingLanguages.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </>
  );
}

function LanguageStep() {
  const navigate = useNavigate();
  const { spokenLanguage, setSpokenLanguage, targetLanguage, setTargetLanguage } = useOnboarding();

  return (
    <SetupWizardLayout
      currentStep={0}
      backTo="/mode-select"
      onNext={() => navigate('/setup/audio')}
      nextLabel="次へ"
    >
      <FormSelect
        label="話す言語"
        value={spokenLanguage}
        onChange={(e) => setSpokenLanguage(e.target.value)}
      >
        <LanguageOptions />
      </FormSelect>
      <FormSelect
        label="翻訳先の言語"
        value={targetLanguage}
        onChange={(e) => setTargetLanguage(e.target.value)}
      >
        <LanguageOptions />
      </FormSelect>
    </SetupWizardLayout>
  );
}

export default LanguageStep;
