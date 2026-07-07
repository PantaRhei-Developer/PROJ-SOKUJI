// Mirrors the quick-access + full language lists in
// src/components/Settings/sections/LanguageSection.tsx so the onboarding
// wizard's language pickers match the existing app's conventions.

export interface LanguageOption {
  value: string;
  label: string;
}

export const quickAccessLanguages: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'zh_CN', label: '中文 (简体)' },
  { value: 'zh_TW', label: '中文 (繁體)' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'pt_PT', label: 'Português (Portugal)' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'hi', label: 'हिन्दी' },
];

const allLanguages: LanguageOption[] = [
  ...quickAccessLanguages,
  { value: 'ar', label: 'العربية' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'ru', label: 'Русский' },
  { value: 'fa', label: 'فارسی' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'it', label: 'Italiano' },
  { value: 'th', label: 'ไทย' },
  { value: 'pl', label: 'Polski' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'uk', label: 'Українська' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'he', label: 'עברית' },
  { value: 'fil', label: 'Filipino' },
  { value: 'sv', label: 'Svenska' },
  { value: 'fi', label: 'Suomi' },
];

const quickAccessValues = new Set(quickAccessLanguages.map((l) => l.value));

export const remainingLanguages: LanguageOption[] = allLanguages
  .filter((l) => !quickAccessValues.has(l.value))
  .sort((a, b) => a.label.localeCompare(b.label));

export function languageLabel(value: string): string {
  return allLanguages.find((l) => l.value === value)?.label ?? value;
}
