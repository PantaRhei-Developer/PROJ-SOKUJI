# Screen: Settings

**Route**: `/settings`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: Read-only summary in this phase — "変更" links jump into the wizard, but nothing is persisted.

## Layout

Single centered column, max-width 480px, 32px top margin.

1. Back link, 14px, top-left: "← セッションに戻る".
2. Title, 24px bold, 24px top margin: "設定".
3. Three summary rows, each a flex row space-between with 16px vertical padding and a bottom `border.default` divider:
   - "モード" — current value ("ローカルモデル" / "API利用") + a "変更" link on the right.
   - "言語" — "{spoken} → {target}" + a "変更" link.
   - "デバイス" — "{microphone label} / {speaker label}" + a "変更" link.

## Navigation

- "← セッションに戻る" → [`/session`](Session.md).
- "変更" next to "モード" → [`/mode-select`](ModeSelect.md).
- "変更" next to "言語" → [`/setup/language`](SetupWizard.md#1-language-setuplanguage).
- "変更" next to "デバイス" → [`/setup/audio`](SetupWizard.md#2-devices-setupaudio).
- Re-entering the wizard from Settings is a direct jump to the named step only — it does not chain forward through the remaining wizard steps in this phase, since nothing is functional yet.

## Data & state

Displays whatever is currently held in the shared onboarding state object (see [SetupWizard § Data & state](SetupWizard.md#data--state)); nothing is fetched or persisted in this phase.

## Error handling / edge cases

None in this phase.
