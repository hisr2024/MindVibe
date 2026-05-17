# Sacred Images — षड्रिपु Journeys

This directory holds the Vedic illuminated manuscript artwork for the Six
Enemies (Shadripu) Journeys feature. All images are optional — the mobile
UI falls back gracefully to an enemy-coloured gradient + sacred geometry
SVG (see `components/mobile/journeys/EnemySVGFallback.tsx`) when a file
is missing. Drop the final WebP files into the locations below and the
cards / hero sections pick them up automatically.

## Master style prompt (append to every image)

> Vedic illuminated manuscript style, deep cosmic indigo background
> (#050714), sacred golden light (#D4A017), painterly divine brushwork,
> cinematic lighting from above, no text overlays, designed for dark UI
> overlay, 16:9 aspect ratio, ultra-detailed, photorealistic sacred
> elements, mystical and transcendent.

## Enemy hero images (`enemies/`)

Referenced by `ENEMY_INFO[*].heroImage` in `types/journeyEngine.types.ts`.

| File             | Enemy   | Colour    | Prompt                                                                                                                                                                                                                                                                              |
|------------------|---------|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `kama.webp`      | Desire  | `#DC2626` | Arjuna on golden chariot surveys the battlefield, ocean waves of desire rising as storm around him, divine light of Krishna piercing crimson storm clouds, lotus flowers emerging from churning waters, sacred fire and cooling rain together, Kurukshetra with cosmic overlay.    |
| `krodha.webp`    | Anger   | `#B45309` | Warrior stilling the inner fire on a sacred battlefield, amber flames in the left hand transforming into a golden lotus in the right, storm clearing to reveal serene blue sky, divine cool rain on hot stone — BG 2.63 energy of krodhad bhavati sammoha as flame becoming wisdom. |
| `lobha.webp`     | Greed   | `#059669` | Open hands releasing golden coins that transform mid-air into lotus flowers floating toward divine light, river of abundance flowing freely, generous king giving to all, emerald forest and golden abundance, sacred geometry of dana (giving).                                   |
| `moha.webp`      | Delusion| `#6D28D9` | Purple veil of maya lifting from a cosmic scene, Atman as brilliant inner light revealed behind the illusion curtain, fog dispersing from a sacred mountain peak, clarity emerging, multiple realities as transparent veils, eternal truth shining through.                         |
| `mada.webp`      | Pride   | `#1D4ED8` | Humble devotee bowing prostrate before the infinite cosmos, ego as a small wave merging into the vast ocean, Krishna's universal form in blue sky, devotee smaller against infinite divine backdrop, drop becoming ocean.                                                          |
| `matsarya.webp`  | Envy    | `#9D174D` | Two rivers flowing together and joining rather than competing, souls as unique stars in the same sky celebrating each other, circle of diverse beings in mudita (sympathetic joy), pink lotus mandala, unity in diversity.                                                         |

## Journey template images (`templates/`)

Referenced by the mobile `JourneyTemplateCard` as
`/images/journeys/templates/journey-${template.id}.webp`.

Provide one WebP per template ID (the backend `/api/journey-engine/templates`
response returns the canonical `id`). If a file is missing the card shows
the enemy gradient + `EnemySVGFallback` symbol instead — no broken image.

Suggested prompts (pick the enemy prompt above, then append one of):

- Taming Desire (21d beginner): monk by ocean, waves of desire arising and passing while meditator remains still, detachment and peace, morning light, Nishkama karma.
- Cooling the Fire (14d beginner, krodha): cooling sacred rain on hot stone, steam rising as anger transforms, warrior laying down a burning sword, before-and-after, krodha becoming shanti.
- The Open Hand (14d beginner, lobha): palm open and giving, golden coins flowing upward, generous river flowing outward, lobha hand opening into dana, green abundance energy.
- Lifting the Veil (21d intermediate, moha): dense morning fog lifting from a sacred mountain to reveal a clear peak, illusion dispersing, clarity emerging, purple becoming gold.
- The Humble Warrior (14d beginner, mada): warrior laying down arms in surrender before the divine, Arjuna's bow-down moment, humility as sacred strength.
- Celebrating Others (14d beginner, matsarya): circle of diverse souls celebrating together, hands raised, all paths honoured, rose-pink and gold unity.

Generate additional template images by composing the master style prompt
with the enemy prompt + a short scenario pulled from the template's
`description` field.
