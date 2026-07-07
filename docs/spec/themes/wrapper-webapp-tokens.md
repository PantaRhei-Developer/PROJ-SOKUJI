# Wrapper Web App — Design Tokens

**Scope**: `webapp/` project only (independent from the existing extension/Electron `src/` theme).

## Color

- Background (page): `#0d1117` (dark)
- Surface (card): `#161b22`
- Border (default): `#30363d`
- Border (selected/focus): `#10a37f` (matches the existing Sokuji primary action color)
- Text (primary): `#e6edf3`
- Text (muted/secondary): `#8b949e`
- Primary action (buttons, selected state): `#10a37f`
- Primary action hover: `#0d8c6d`
- Error: `#e74c3c`
- Badge "Recommended": background `#10a37f`, text `#0d1117`

## Typography

- Font family: system UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
- Page title: 24px / bold
- Section subtitle: 14px / regular, muted color
- Body: 14px / regular
- Button label: 15px / medium
- Footer/legal text: 12px / regular, muted color

## Spacing scale

4 / 8 / 12 / 16 / 24 / 32 / 48 (px)

## Icons

- Lucide React, 16px default size (matches the existing app's 14–16px convention)

## Layout

- Max content width for centered single-column screens (Login, Settings): 400px
- Max content width for wizard/mode-select screens: 640px
- Card border-radius: 12px
- Button height: 44px, border-radius 8px
- Buttons go full-width on viewports ≤ 400px wide

Every screen and component spec under `docs/spec/` references these tokens by name instead of repeating raw values, so a visual change only needs to happen here.
