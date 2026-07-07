# Screen: Login

**Route**: `/login`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: UI shell only — no real authentication in this phase (see the [2026-07-07 design doc](../../superpowers/specs/2026-07-07-sokuji-wrapper-webapp-design.md) for scope).

## Layout

Single centered card, max-width 400px, vertically and horizontally centered in the viewport against the `background` token.

Top to bottom inside the card (24px padding, 16px vertical gap between blocks):

1. Logo mark (`src/assets/logo.png`, reused from the existing app, rendered at 32px square) + product name text (24px bold): "SOKUJI Allo", side by side, centered as a group.
2. Tagline, one line, 14px muted: "設定不要のリアルタイム翻訳。"
3. Primary button, full card width, 44px height: white background, `#1f1f1f` text, following Google's standard "Sign in with Google" branding guidelines (official multicolor "G" logomark, 18px, left-aligned inside the button, 8px gap to the label text "Googleでログイン").
4. Footer text, 12px muted, centered: "利用規約 · プライバシーポリシー" — each phrase is a separate link (placeholder `href="#"` in this phase).

## Navigation

- Click "Googleでログイン" → navigate to [`/mode-select`](ModeSelect.md). No network/auth call is made in this phase.
- No back navigation (entry screen).

## Data & state

None. Fully static.

## Error handling / edge cases

None in this phase — the button never shows a loading or error state since it performs no real request.
