# UI Components

These reusable pieces follow shadcn/ui patterns with Tailwind + Radix for accessibility.

## Button (`Button`)
- Variants: `default`, `secondary`, `ghost`, `outline`.
- Sizes: `sm`, `md`, `lg`, `icon`.
- Uses Radix `Slot` to support `asChild` composition and includes WCAG-visible focus rings.

## Card (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`)
- Rounded, softly-shadowed containers for grouping related information.
- Designed for responsive layouts and calming backgrounds.

## Input / Textarea
- Large tap targets with high-contrast focus states and descriptive helper text via `aria-describedby`.

## Badge
- Inline pill for status or tags; avoids harsh colors and keeps typography uppercase for quick scanning.

## Modal
- Built on Radix Dialog (`Modal`, `ModalTrigger`, `ModalContent`, `ModalTitle`, `ModalDescription`).
- Includes accessible close button and overlay for focus trapping and screen-reader clarity.

## Skeleton
- Lightweight placeholder for loading states to prevent layout shift during async requests.
