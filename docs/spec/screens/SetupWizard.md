# Screen: Setup Wizard

**Routes**: `/setup/language`, `/setup/audio`, `/setup/confirm`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Components**: [StepIndicator](../components/StepIndicator.md)

Three routed steps sharing one layout shell.

## Shared layout

- [StepIndicator](../components/StepIndicator.md) with `steps={["言語", "デバイス", "確認"]}`, `currentStep` set to 0/1/2 to match the current route.
- Content area below, max-width 480px, centered.
- Footer nav bar, 32px top margin, flex row with space-between:
  - Left: text link "← 戻る"
  - Right: primary button, labeled "次へ" on steps 1–2, labeled "セッションを開始" on step 3.

## 1. Language (`/setup/language`)

- Two stacked native `<select>` elements, 16px gap:
  - "話す言語" — default `日本語`.
  - "翻訳先の言語" — default `English`.
- Each select lists the same 12 quick-access languages first, in this order — English, 中文简体, 中文繁體, 日本語, 한국어, Español, Français, Deutsch, Português (Brasil), Português (Portugal), Tiếng Việt, हिन्दी (the `simplifiedLanguages` list from `src/components/Settings/sections/LanguageSection.tsx`) — then a disabled divider option (`──────`), then the remaining supported languages alphabetically.
- "次へ" is always enabled (defaults are pre-filled) → [`/setup/audio`](#2-devices-setupaudio).
- "← 戻る" → [`/mode-select`](ModeSelect.md).

## 2. Devices (`/setup/audio`)

- Two stacked native `<select>` elements, 16px gap:
  - "マイク" — populated from `navigator.mediaDevices.enumerateDevices()` filtered to `audioinput`; if permission/enumeration is unavailable in this phase, show a single static placeholder option "デフォルトのマイク".
  - "スピーカー" — same pattern filtered to `audiooutput`, placeholder "デフォルトのスピーカー".
- Always show an info badge directly below the Speaker select, regardless of the mode chosen in [ModeSelect](ModeSelect.md): a 14px Lucide `Info` icon + text "ビデオ通話アプリで使いますか？SOKUJI Alloの翻訳音声を仮想マイク経由で流すと、相手にも聞こえます。" (12px, muted), with a tooltip (reusing the existing app's Tooltip component) on hover/focus explaining that the virtual microphone lets Zoom/Google Meet/Microsoft Teams pick up the translated audio as if it came from the user's real mic. This is unrelated to the mode choice — it exists purely for users who want to be heard in a video call, whether they picked Local or API.
- "次へ" is always enabled → [`/setup/confirm`](#3-confirm-setupconfirm).
- "← 戻る" → [`/setup/language`](#1-language-setuplanguage).

## 3. Confirm (`/setup/confirm`)

- A summary card (same visual style as [ModeCard](../components/ModeCard.md), but non-interactive: no badge, no selection/hover/focus states) listing one row each:
  - "モード": "ローカルモデル" or "API利用"
  - "言語": "{spoken language} → {target language}"
  - "マイク": selected device label
  - "スピーカー": selected device label
- "セッションを開始" button (primary, full width of the content column) → [`/session`](Session.md).
- "← 戻る" → [`/setup/audio`](#2-devices-setupaudio).

## Data & state

Selections from all three steps — `mode` (carried over from [ModeSelect](ModeSelect.md)), `spokenLanguage`, `targetLanguage`, `microphoneId`, `speakerId` — live in one shared onboarding state object for the duration of the flow (a React context scoped to the `/mode-select` + `/setup/*` + `/settings` route tree). Nothing is persisted to a backend in this phase.

## Error handling / edge cases

If `enumerateDevices()` throws or returns an empty list, fall back to the static placeholder option described above rather than leaving a select empty.
