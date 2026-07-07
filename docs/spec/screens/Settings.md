# Screen: Settings

**Route**: `/settings`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: Read-only summary in this phase — "Change" links jump into the wizard, but nothing is persisted.

## Layout

Single centered column, max-width 480px, 32px top margin.

1. Back link, 14px, top-left: "← Back to session".
2. Title, 24px bold, 24px top margin: "Settings".
3. Three summary rows, each a flex row space-between with 16px vertical padding and a bottom `border.default` divider:
   - "Mode" — current value ("Local model" / "API usage") + a "Change" link on the right.
   - "Languages" — "{spoken} → {target}" + a "Change" link.
   - "Devices" — "{microphone label} / {speaker label}" + a "Change" link.

## Navigation

- "← Back to session" → [`/session`](Session.md).
- "Change" next to "Mode" → [`/mode-select`](ModeSelect.md).
- "Change" next to "Languages" → [`/setup/language`](SetupWizard.md#1-language-setuplanguage).
- "Change" next to "Devices" → [`/setup/audio`](SetupWizard.md#2-devices-setupaudio).
- Re-entering the wizard from Settings is a direct jump to the named step only — it does not chain forward through the remaining wizard steps in this phase, since nothing is functional yet.

## Data & state

Displays whatever is currently held in the shared onboarding state object (see [SetupWizard § Data & state](SetupWizard.md#data--state)); nothing is fetched or persisted in this phase.

## Error handling / edge cases

None in this phase.
