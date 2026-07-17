# Screen: Mode Select

**Route**: `/mode-select`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Components**: [ModeCard](../components/ModeCard.md)
**Status**: This is the last screen in `webapp/` — see the [2026-07-11 extension handoff design doc](../../superpowers/specs/2026-07-11-webapp-extension-handoff-design.md) for why. There is no setup wizard, session, or settings screen in this project anymore; the Sokuji Chrome extension owns all of that. The route is wrapped in `RequireAuth` — an unauthenticated visitor is redirected to `/login` before this screen ever renders.

## Layout

Column vertically and horizontally centered in the viewport (`min-height: 100vh`, flex column, `justify-content: center`), max-width 640px.

0. Account row, flex row, right-aligned, 14px muted text: the signed-in user's email, followed by a "ログアウト" text link (`color.error`, hover underline).
1. Title, 24px bold, centered, `space-5` top margin below the account row: "翻訳方式を選んでください"
2. Subtitle, 14px muted, centered, 8px below the title: "設定は後から変更できます。"
3. Two [ModeCard](../components/ModeCard.md) instances in a flex row, 24px gap, 32px top margin, wrapping to a column below a 640px viewport width. Neither card is marked as superior — both get a neutral tagline badge stating their core trade-off, not a value judgment:
   - **ローカルモデル** — tagline `"無料・高速"`, bullets `["無料", "高速レスポンス", "初回起動時に約4GBのダウンロードが必要"]`
   - **API利用** — tagline `"従量課金・ダウンロード不要"`, bullets `["インストール不要ですぐ使える", "従量課金、APIキー不要", "レスポンスはやや遅め"]`
4. Status message (only rendered after "次へ" is pressed), 14px, centered, `space-5` top margin, padded pill background:
   - Success (`color.primary` text on a tinted `color.primary` background): "拡張機能に設定を送りました。Sokuji拡張機能を開いてください。"
   - Fallback (`color.error` text on a tinted `color.error` background): "Sokuji拡張機能が見つかりませんでした。[Chromeウェブストアからインストール](リンク)してから、もう一度お試しください。" — the link opens in a new tab.
5. Footer bar, 32px top margin, flex row with space-between:
   - Left: text link "← 戻る" (14px, muted, hover `text.primary`)
   - Right: primary button "次へ", 44px height, disabled (50% opacity, no pointer events) until a card is selected or while the handoff is in flight.

## Navigation

- "ログアウト" → calls `signOut(auth)` (see `webapp/src/lib/firebase.ts`), then navigates to [`/login`](Login.md).
- "← 戻る" → [`/login`](Login.md)
- "次へ" (enabled only after a card is selected) → calls `sendModeToExtension(mode)` (see `webapp/src/lib/extensionHandoff.ts`). This does **not** navigate anywhere within `webapp/` — there is nowhere left to go. On a successful handoff the extension opens its own UI independently; `webapp/` only shows the success/fallback status message described above.

## Data & state

- Authenticated user (see `webapp/src/context/AuthContext.tsx`) — only its `email` is read, for the account row.
- Shared onboarding state `mode: 'local' | 'api' | null` (see `webapp/src/context/OnboardingContext.tsx`), initialized to `null`.
- Selecting a card sets `mode` to that card's value; selecting the other card replaces it (single-select, not independent toggles).
- Local screen state `handoffState: 'idle' | 'sending' | 'delivered' | 'fallback'`, drives the status message and the "次へ" button's disabled state while `'sending'`.

## Error handling / edge cases

- "次へ" is unreachable (disabled) while `mode` is `null` — this is the only validation needed before attempting a handoff.
- The extension not being installed and the extension simply not responding in time are indistinguishable from `webapp/`'s point of view — both surface the same fallback message. `sendModeToExtension` uses an 800ms timeout since `chrome.runtime.sendMessage` to a non-existent extension ID does not reliably reject or invoke its callback promptly.
