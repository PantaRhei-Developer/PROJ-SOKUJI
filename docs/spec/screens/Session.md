# Screen: Session

**Route**: `/session`
**Tokens**: [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)
**Status**: Static placeholder — no audio capture, recognition, or translation runs in this phase.

## Layout

Full-height single column.

1. Top bar, 56px height, flex row space-between, bottom border `border.default`:
   - Left: `src/assets/logo.png` reused from the existing app, rendered at 24px, + product name (16px bold): "SOKUJI Allo".
   - Right: Settings icon button (Lucide `Settings`, 20px, `aria-label="設定"`).
2. Conversation area, flexible height, scrollable, 24px padding: two static dummy rows visually matching the existing app's `ConversationRow` component (`src/components/MainPanel/ConversationRow`) — same CSS class names/colors, reimplemented locally since the real component depends on i18next/session-store types not present in this standalone app (see the implementation plan's "Decided at implementation time" note) — with hardcoded props: source text "これはサンプルの文章です。" and translation text "This is a sample sentence.". Below them, centered placeholder text: "ここに会話が表示されます。"
3. Bottom status footer, 64px height, top border `border.default`, flex row centered: a dummy microphone icon (Lucide `Mic`, 20px, disabled/inert styling) + status text "セッション中（プレースホルダー）" (14px muted) to its right.

## Navigation

- Settings icon (top-right) → [`/settings`](Settings.md).
- No other navigation from this screen in this phase (no "end session" action yet).

## Data & state

None — all content (bubbles, status text) is static/hardcoded.

## Error handling / edge cases

None in this phase.
