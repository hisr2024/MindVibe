# Font Licenses

Every font shipped in this repository is governed by the SIL Open Font
License 1.1 (OFL), an open-source license that permits use, study,
modification, and redistribution — including commercial use — provided
the font itself is not sold standalone.

This file is the canonical record of every font we ship, its upstream
source, and a link to the license text. If you add or remove a font,
update this file in the same commit.

## Files bundled in this repository

Path: `kiaanverse-mobile/apps/mobile/assets/fonts/`

| Filename | Family | Weight / Style | License | Source |
|---|---|---|---|---|
| `Outfit-Regular.ttf` | Outfit | Regular (400) | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Outfit |
| `Outfit-Medium.ttf` | Outfit | Medium (500) | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Outfit |
| `Outfit-SemiBold.ttf` | Outfit | SemiBold (600) | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Outfit |
| `CrimsonText-Regular.ttf` | Crimson Text | Regular | OFL-1.1 (Copyright 2010 Crimson Text Project) | Google Fonts — https://fonts.google.com/specimen/Crimson+Text |
| `CrimsonText-Italic.ttf` | Crimson Text | Italic | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Crimson+Text |
| `CormorantGaramond-Light.ttf` | Cormorant Garamond | Light (300) | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Cormorant+Garamond |
| `CormorantGaramond-LightItalic.ttf` | Cormorant Garamond | Light Italic | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Cormorant+Garamond |
| `CormorantGaramond-SemiBold.ttf` | Cormorant Garamond | SemiBold (600) | OFL-1.1 | Google Fonts — https://fonts.google.com/specimen/Cormorant+Garamond |
| `NotoSansDevanagari-Regular.ttf` | Noto Sans Devanagari | Regular | OFL-1.1 (Google / SIL) | Google Fonts — https://fonts.google.com/noto/specimen/Noto+Sans+Devanagari |
| `NotoSansDevanagari-Medium.ttf` | Noto Sans Devanagari | Medium | OFL-1.1 | Same |
| `NotoSansDevanagari-Bold.ttf` | Noto Sans Devanagari | Bold | OFL-1.1 | Same |

## License text

The full SIL Open Font License v1.1 is at: https://scripts.sil.org/OFL

Salient terms (paraphrased — the license text governs):

- **You may** use the fonts in any product (free or commercial), embed
  them in apps, modify them, and redistribute them.
- **You must** preserve the copyright notice and OFL license text when
  redistributing the font files themselves (e.g. inside the APK / IPA
  bundle).
- **You must not** sell the fonts standalone (i.e. as a font product).
- **You must not** use the original Reserved Font Names of these
  families for any modified version you redistribute. We do not modify
  the fonts — we ship them unchanged.

## In-app attribution

OFL does NOT require visible attribution inside the running app, but
including a credits screen is best practice. Kiaanverse's
`/(app)/about` and the web `/credits` page list the typography credit
together with the other open-source acknowledgements.

## When you add a new font

1. Verify the font's license. We only accept OFL, Apache 2.0, or
   public-domain typefaces. Commercial-only foundry licenses are
   never acceptable.
2. Add the file to the appropriate `assets/fonts/` directory and load
   it with `expo-font` / `next/font/local`.
3. Append a new row to the table above with the source URL.
4. If the license text differs from OFL, include the full license text
   in `legal/font-licenses/<font-name>.txt`.

## When you remove a font

1. Delete the `.ttf` / `.otf` file.
2. Remove the row from the table above.
3. Update any `expo-font` / `next/font` loaders that referenced it.
