import type { ReactNode } from 'react';
import StepIndicator from '../../components/StepIndicator/StepIndicator';
import PrimaryButton from '../../components/common/PrimaryButton';
import BackLink from '../../components/common/BackLink';
import './SetupWizardLayout.scss';

const STEPS = ['言語', 'デバイス', '確認'];

interface SetupWizardLayoutProps {
  currentStep: number;
  backTo: string;
  onNext: () => void;
  nextLabel: string;
  children: ReactNode;
}

function SetupWizardLayout({ currentStep, backTo, onNext, nextLabel, children }: SetupWizardLayoutProps) {
  return (
    <div className="setup-wizard">
      <StepIndicator steps={STEPS} currentStep={currentStep} />
      <div className="setup-wizard__content">{children}</div>
      <div className="setup-wizard__footer">
        <BackLink to={backTo} />
        <PrimaryButton onClick={onNext}>{nextLabel}</PrimaryButton>
      </div>
    </div>
  );
}

export default SetupWizardLayout;
