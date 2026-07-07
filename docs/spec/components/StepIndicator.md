# Component: StepIndicator

**Used by**: [SetupWizard screen](../screens/SetupWizard.md)
**Tokens**: see [wrapper-webapp-tokens](../themes/wrapper-webapp-tokens.md)

## Purpose

Shows wizard progress as a horizontal row of steps so the user always knows how many steps remain.

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `steps` | `string[]` | yes | Step labels in order, e.g. `["Language", "Devices", "Confirm"]` |
| `currentStep` | `number` | yes | 0-indexed position of the active step |

## Visual design

- Horizontal row, centered, 32px top margin, 24px bottom margin.
- Each step: a 28px-diameter circle showing the 1-indexed step number, with a label below it (12px, muted).
- Circles are connected by a 2px horizontal line, 40px long, vertically centered on the circles.
- Circle for steps `< currentStep` (completed): filled `#10a37f` background, white Lucide `Check` icon (14px) replacing the number; the connecting line to its right is `#10a37f`.
- Circle for `=== currentStep` (active): 2px `#10a37f` border, `surface` background, bold `#10a37f` number.
- Circle for `> currentStep` (upcoming): 1px `border.default`, `surface` background, `text.muted` number.

## States

Purely presentational; not clickable, no interaction states.

## Usage example

`<StepIndicator steps={["Language", "Devices", "Confirm"]} currentStep={0} />` on the language step of [SetupWizard](../screens/SetupWizard.md).
