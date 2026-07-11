# Screen: Settings

**Route**: `/settings`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: Onboarding rows are a read-only summary — "変更" links jump into the wizard, but nothing is persisted. The account row and logout are wired to real Firebase Authentication.

## Layout

Single column, vertically and horizontally centered in the viewport (`min-height: 100vh`, flex column, `justify-content: center`), max-width 480px.

1. Back link, 14px, left-aligned (`align-self: flex-start` so it doesn't stretch/center like the rest of the flex column): "← セッションに戻る".
2. Title, 24px bold, 24px top margin: "設定".
3. Four summary rows, each a flex row space-between with 16px vertical padding and a bottom `border.default` divider:
   - "モード" — current value ("ローカルモデル" / "API利用") + a "変更" link on the right (`color.primary`).
   - "言語" — "{spoken} → {target}" + a "変更" link.
   - "デバイス" — "{microphone label} / {speaker label}" + a "変更" link.
   - "アカウント" — the signed-in user's email (`useAuth().user.email`) + a "ログアウト" link on the right, styled identically to "変更" but in `color.error` so it reads as a distinct, leaving action.

## Navigation

- "← セッションに戻る" → [`/session`](Session.md).
- "変更" next to "モード" → [`/mode-select`](ModeSelect.md).
- "変更" next to "言語" → [`/setup/language`](SetupWizard.md#1-language-setuplanguage).
- "変更" next to "デバイス" → [`/setup/audio`](SetupWizard.md#2-devices-setupaudio).
- "ログアウト" → Firebase `signOut(auth)`, then navigate to [`/login`](Login.md).
- Re-entering the wizard from Settings is a direct jump to the named step only — it does not chain forward through the remaining wizard steps in this phase, since nothing is functional yet.

## Data & state

- Onboarding summary values come from the shared onboarding state object (see [SetupWizard § Data & state](SetupWizard.md#data--state)); nothing is fetched or persisted in this phase.
- The account row reads `useAuth()` (see [2026-07-11 design doc](../../superpowers/specs/2026-07-11-webapp-firebase-auth-design.md)) for the current Firebase user's email.

## Error handling / edge cases

None in this phase — `signOut` is not expected to fail in normal use, and no retry/error UI is specified for it.
