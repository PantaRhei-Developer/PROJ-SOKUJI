# Screen: Login

**Route**: `/login`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: Real Firebase Authentication (Google Sign-In) as of the [2026-07-11 design doc](../../superpowers/specs/2026-07-11-webapp-firebase-auth-design.md); the screens-only phase's no-op navigation has been replaced.

## Layout

Single centered card, max-width 400px, vertically and horizontally centered in the viewport against the `background` token.

Top to bottom inside the card (24px padding, 16px vertical gap between blocks):

1. Logo mark (`src/assets/logo.png`, reused from the existing app, rendered at 32px square) + product name text (24px bold): "SOKUJI Allo", side by side, centered as a group.
2. Tagline, one line, 14px muted: "設定不要のリアルタイム翻訳。"
3. Primary button, full card width, 44px height: white background, `#1f1f1f` text, following Google's standard "Sign in with Google" branding guidelines (official multicolor "G" logomark, 18px, left-aligned inside the button, 8px gap to the label text "Googleでログイン").
4. Footer text, 12px muted, centered: "利用規約 · プライバシーポリシー" — each phrase is a separate link (placeholder `href="#"` in this phase).
5. Error text (only rendered when present), 12px, `color.error`, centered, below the button.

## Navigation

- Click "Googleでログイン" → calls Firebase `signInWithPopup(auth, googleProvider)`. On success, navigate to [`/mode-select`](ModeSelect.md) (always — this phase does not check for a previously-completed onboarding).
- If the user is already authenticated and lands on `/login` directly, redirect immediately to [`/mode-select`](ModeSelect.md) without showing the card.
- No back navigation (entry screen).

## Data & state

- `isSigningIn: boolean` — while the popup flow is in progress, the Google button is `disabled` (60% opacity) to prevent double-submits. Label text does not change.
- `error: string | null` — set on sign-in failure, cleared at the start of each attempt.
- Reads `useAuth()` (see [SetupWizard § Data & state](SetupWizard.md#data--state) for the sibling `OnboardingContext` pattern this follows) to detect an already-signed-in user for the redirect above.

## Error handling / edge cases

- User closes the Google popup (`auth/popup-closed-by-user`) → treated as a cancel: no error message, button returns to its normal state.
- Popup blocked by the browser (`auth/popup-blocked`) → error text: "ポップアップがブロックされました。ブラウザの設定を確認してください。"
- Any other sign-in failure → error text: "ログインできませんでした。もう一度お試しください。"
