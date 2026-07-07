# Component: ModeCard

**Used by**: [ModeSelect screen](../screens/ModeSelect.md)
**Tokens**: see [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)

## Purpose

A selectable card presenting one translation mode ("Local model" or "API usage") as an equally-valid trade-off, so the user picks exactly one before continuing the setup wizard.

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | yes | Mode name, e.g. "Local model" |
| `bullets` | `string[]` | yes | 2–4 short feature bullets, rendered in the given order |
| `tagline` | `string` | no | Optional short, neutral pill label stating a trade-off, e.g. "Free · Fast" — never a value judgment like "Recommended", since the two modes are presented as equally valid choices |
| `selected` | `boolean` | yes | Controls the selected visual state |
| `onSelect` | `() => void` | yes | Fired on click, or Enter/Space while focused |

## Visual design

- Width: flexible, min 260px, max 320px; two cards sit side by side with a 24px gap, wrapping to a single column below a 640px viewport width.
- Padding: 24px.
- Border: 1px solid `border.default`; becomes 2px `border.selected` with a `#10a37f` box-shadow glow when `selected` is true.
- Background: `surface` token; unchanged on selection (only border/shadow change).
- Tagline pill: absolute top-right corner, -10px offset, pill shape, 11px bold uppercase text, `border.default`-colored background with `text.primary` text (neutral — not the green "selected" color, so it never reads as an endorsement).
- Bullets: unordered list, each item prefixed with a 14px Lucide `Check` icon, 8px gap between items.
- Title: 18px bold, 12px margin-bottom.

## States

- **Default**: `border.default`, no shadow.
- **Hover**: border lightens to `text.muted`, cursor pointer.
- **Selected**: `border.selected` + glow; a Lucide `CheckCircle2` icon (20px, `#10a37f`) appears top-left, overlapping the border.
- **Focus (keyboard)**: 2px `#10a37f` outline, 2px offset (in addition to the selected style if both apply).

## Interaction

Click, or `Enter`/`Space` while focused, calls `onSelect`. The parent screen owns which single card is selected — choosing one card clears the other (radio-group behavior), it is not a per-card toggle.

## Usage example

Two instances placed in a flex row on [ModeSelect](../screens/ModeSelect.md), both with a tagline so neither reads as "the" recommended choice: "Local model" (tagline `"Free · Fast"`, bullets `["Free", "Fast responses", "First run downloads ~4GB"]`) and "API usage" (tagline `"Pay-as-you-go · No download"`, bullets `["Ready instantly, nothing to install", "Pay-as-you-go, no API key needed", "Responses are somewhat slower"]`).
