# Screen: Mode Select

**Route**: `/mode-select`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Components**: [ModeCard](../components/ModeCard.md)

## Layout

Centered column, max-width 640px, 48px top margin.

1. Title, 24px bold, centered: "Choose how you want to translate"
2. Subtitle, 14px muted, centered, 8px below the title: "You can change this later in Settings."
3. Two [ModeCard](../components/ModeCard.md) instances in a flex row, 24px gap, 32px top margin, wrapping to a column below a 640px viewport width. Neither card is marked as superior — both get a neutral tagline badge stating their core trade-off, not a value judgment:
   - **Local model** — tagline `"Free · Fast"`, bullets `["Free", "Fast responses", "First run downloads ~4GB"]`
   - **API usage** — tagline `"Pay-as-you-go · No download"`, bullets `["Ready instantly, nothing to install", "Pay-as-you-go, no API key needed", "Responses are somewhat slower"]`
4. Footer bar, 32px top margin, flex row with space-between:
   - Left: text link "← Back" (14px, muted, hover `text.primary`)
   - Right: primary button "Next", 44px height, disabled (50% opacity, no pointer events) until a card is selected.

## Navigation

- "← Back" → [`/login`](Login.md)
- "Next" (enabled only after a card is selected) → [`/setup/language`](SetupWizard.md#1-language-setuplanguage)

## Data & state

- Local screen state `selectedMode: 'local' | 'api' | null`, initialized to `null`.
- Selecting a card sets `selectedMode` to that card's value; selecting the other card replaces it (single-select, not independent toggles).
- `selectedMode` is carried forward into the shared onboarding state described in [SetupWizard § Data & state](SetupWizard.md#data--state) so the Confirm step can display the chosen mode.

## Error handling / edge cases

- "Next" is unreachable (disabled) while `selectedMode` is `null` — this is the only validation needed in this phase.
