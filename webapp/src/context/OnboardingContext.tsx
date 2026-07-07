import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type TranslationMode = 'local' | 'api';

interface OnboardingState {
  mode: TranslationMode | null;
  spokenLanguage: string;
  targetLanguage: string;
  microphoneId: string;
  microphoneLabel: string;
  speakerId: string;
  speakerLabel: string;
}

interface OnboardingContextValue extends OnboardingState {
  setMode: (mode: TranslationMode) => void;
  setSpokenLanguage: (value: string) => void;
  setTargetLanguage: (value: string) => void;
  setMicrophone: (id: string, label: string) => void;
  setSpeaker: (id: string, label: string) => void;
}

const defaultState: OnboardingState = {
  mode: null,
  spokenLanguage: 'ja',
  targetLanguage: 'en',
  microphoneId: '',
  microphoneLabel: 'デフォルトのマイク',
  speakerId: '',
  speakerLabel: 'デフォルトのスピーカー',
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      ...state,
      setMode: (mode) => setState((prev) => ({ ...prev, mode })),
      setSpokenLanguage: (spokenLanguage) => setState((prev) => ({ ...prev, spokenLanguage })),
      setTargetLanguage: (targetLanguage) => setState((prev) => ({ ...prev, targetLanguage })),
      setMicrophone: (microphoneId, microphoneLabel) =>
        setState((prev) => ({ ...prev, microphoneId, microphoneLabel })),
      setSpeaker: (speakerId, speakerLabel) =>
        setState((prev) => ({ ...prev, speakerId, speakerLabel })),
    }),
    [state]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
