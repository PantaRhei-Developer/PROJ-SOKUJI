# Screen: Mode Select

**Route**: `/mode-select`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Components**: [ModeCard](../components/ModeCard.md)

## Layout

Column vertically and horizontally centered in the viewport (`min-height: 100vh`, flex column, `justify-content: center`), max-width 640px.

1. Title, 24px bold, centered: "翻訳方式を選んでください"
2. Subtitle, 14px muted, centered, 8px below the title: "設定は後から変更できます。"
3. Two [ModeCard](../components/ModeCard.md) instances in a flex row, 24px gap, 32px top margin, wrapping to a column below a 640px viewport width. Neither card is marked as superior — both get a neutral tagline badge stating their core trade-off, not a value judgment:
   - **ローカルモデル** — tagline `"無料・高速"`, bullets `["無料", "高速レスポンス", "初回起動時に約4GBのダウンロードが必要"]`
   - **API利用** — tagline `"従量課金・ダウンロード不要"`, bullets `["インストール不要ですぐ使える", "従量課金、APIキー不要", "レスポンスはやや遅め"]`
4. Footer bar, 32px top margin, flex row with space-between:
   - Left: text link "← 戻る" (14px, muted, hover `text.primary`)
   - Right: primary button "次へ", 44px height, disabled (50% opacity, no pointer events) until a card is selected.

## Navigation

- "← 戻る" → [`/login`](Login.md)
- "次へ" (enabled only after a card is selected) → [`/setup/language`](SetupWizard.md#1-language-setuplanguage)

## Data & state

- Local screen state `selectedMode: 'local' | 'api' | null`, initialized to `null`.
- Selecting a card sets `selectedMode` to that card's value; selecting the other card replaces it (single-select, not independent toggles).
- `selectedMode` is carried forward into the shared onboarding state described in [SetupWizard § Data & state](SetupWizard.md#data--state) so the Confirm step can display the chosen mode.

## Error handling / edge cases

- "次へ" is unreachable (disabled) while `selectedMode` is `null` — this is the only validation needed in this phase.
