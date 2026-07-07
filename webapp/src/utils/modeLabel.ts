import type { TranslationMode } from '../context/OnboardingContext';

export function modeLabel(mode: TranslationMode | null): string {
  return mode === 'local' ? 'ローカルモデル' : 'API利用';
}
