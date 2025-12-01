# Bhagavad Gita Corpus – Coverage, Sources, and Licensing

## Coverage
- 18 chapters, 700 verses (standard enumeration)
- Fields per verse: Sanskrit, transliteration, translations (en, hi), word-by-word, themes, principles, sources, tags
- File layout: data/gita/corpus/01.json … 18.json

## Canonical Numbering
- Standard 700-verse layout; verse counts per chapter used for validation:
  1:47, 2:72, 3:43, 4:42, 5:29, 6:47, 7:30, 8:28, 9:34, 10:42, 11:55, 12:20, 13:35, 14:27, 15:20, 16:24, 17:28, 18:78

## Sources and Licensing
- Sanskrit text: public domain
- Translations and word-by-word meanings:
  - Ensure license compatibility (e.g., CC BY/CC0) or explicit permissions.
  - Maintain a per-verse `sources` array with name, URL, and license.

## Import Pipeline
- scripts/validate_gita_corpus.py – validates structure, counts, and required fields
- scripts/import_gita_corpus.py – idempotent upsert into DB

## Testing
- Validation ensures:
  - Full verse counts per chapter
  - No duplicates per chapter
  - Required fields present (sanskrit, translations.en)

## Maintenance
- To add/adjust a verse: edit chapter JSON, run validator, then re-import
- To add a translation: extend `translations` map and rerun import
- To add themes/keywords: update the verse arrays and the taxonomy tables
