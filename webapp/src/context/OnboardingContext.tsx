import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type TranslationMode = 'local' | 'api';

interface OnboardingContextValue {
  mode: TranslationMode | null;
  setMode: (mode: TranslationMode) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TranslationMode | null>(null);

  const value = useMemo<OnboardingContextValue>(() => ({ mode, setMode }), [mode]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
