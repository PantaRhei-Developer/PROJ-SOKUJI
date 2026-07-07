# Screen: Setup Wizard

**Routes**: `/setup/language`, `/setup/audio`, `/setup/confirm`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Components**: [StepIndicator](../components/StepIndicator.md)

Three routed steps sharing one layout shell.

## Shared layout

- [StepIndicator](../components/StepIndicator.md) with `steps={["Language", "Devices", "Confirm"]}`, `currentStep` set to 0/1/2 to match the current route.
- Content area below, max-width 480px, centered.
- Footer nav bar, 32px top margin, flex row with space-between:
  - Left: text link "← Back"
  - Right: primary button, labeled "Next" on steps 1–2, labeled "Start session" on step 3.

## 1. Language (`/setup/language`)

- Two stacked native `<select>` elements, 16px gap:
  - "I will speak in" — default `Japanese`.
  - "Translate to" — default `English`.
- Each select lists the same 12 quick-access languages first, in this order — English, 中文简体, 中文繁體, 日本語, 한국어, Español, Français, Deutsch, Português (Brasil), Português (Portugal), Tiếng Việt, हिन्दी (the `simplifiedLanguages` list from `src/components/Settings/sections/LanguageSection.tsx`) — then a disabled divider option (`──────`), then the remaining supported languages alphabetically.
- "Next" is always enabled (defaults are pre-filled) → [`/setup/audio`](#2-devices-setupaudio).
- "← Back" → [`/mode-select`](ModeSelect.md).

## 2. Devices (`/setup/audio`)

- Two stacked native `<select>` elements, 16px gap:
  - "Microphone" — populated from `navigator.mediaDevices.enumerateDevices()` filtered to `audioinput`; if permission/enumeration is unavailable in this phase, show a single static placeholder option "Default microphone".
  - "Speaker" — same pattern filtered to `audiooutput`, placeholder "Default speaker".
- Always show an info badge directly below the Speaker select, regardless of the mode chosen in [ModeSelect](ModeSelect.md): a 14px Lucide `Info` icon + text "Using a video call app? Route Sokuji's translated audio through the virtual microphone so others hear it." (12px, muted), with a tooltip (reusing the existing app's Tooltip component) on hover/focus explaining that the virtual microphone lets Zoom/Google Meet/Microsoft Teams pick up the translated audio as if it came from the user's real mic. This is unrelated to the mode choice — it exists purely for users who want to be heard in a video call, whether they picked Local or API.
- "Next" is always enabled → [`/setup/confirm`](#3-confirm-setupconfirm).
- "← Back" → [`/setup/language`](#1-language-setuplanguage).

## 3. Confirm (`/setup/confirm`)

- A summary card (same visual style as [ModeCard](../components/ModeCard.md), but non-interactive: no badge, no selection/hover/focus states) listing one row each:
  - "Mode": "Local model" or "API usage"
  - "Languages": "{spoken language} → {target language}"
  - "Microphone": selected device label
  - "Speaker": selected device label
- "Start session" button (primary, full width of the content column) → [`/session`](Session.md).
- "← Back" → [`/setup/audio`](#2-devices-setupaudio).

## Data & state

Selections from all three steps — `mode` (carried over from [ModeSelect](ModeSelect.md)), `spokenLanguage`, `targetLanguage`, `microphoneId`, `speakerId` — live in one shared onboarding state object for the duration of the flow (a React context scoped to the `/mode-select` + `/setup/*` + `/settings` route tree). Nothing is persisted to a backend in this phase.

## Error handling / edge cases

If `enumerateDevices()` throws or returns an empty list, fall back to the static placeholder option described above rather than leaving a select empty.
