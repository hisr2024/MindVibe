#!/usr/bin/env python3
"""Generate themes.json — UI theme ID → curated list of verse_refs.

Each of the 6 Home screen theme tiles maps to a set of mental_health_applications
and/or corpus-level themes that semantically belong to that bucket. We scan the
restored 701-verse corpus and emit a small JSON file the mobile + web apps can
read directly to surface curated, dharmically-grouped verse lists.

Output shape:
  {
    "peace":      ["2.56", "5.27", "6.7", ...],
    "courage":    ["2.37", "3.30", ...],
    "wisdom":     [...],
    "devotion":   [...],
    "action":     [...],
    "detachment": [...]
  }

Curation rules (tags ANY-match → bucket):
  peace      → inner_peace, mindfulness, stress_reduction, acceptance,
               emotional_regulation, anxiety_management
  courage    → resilience, conflict_resolution, purpose_and_meaning,
               personal_growth
  wisdom     → self_knowledge, self_awareness, discernment, self_discovery,
               cognitive_awareness, knowledge_wisdom
  devotion   → devotion, self_compassion, interconnection, devotion_love,
               divine_glories, royal_knowledge
  action     → self_discipline, integration, selfless_action, renunciation_action
  detachment → letting_go, liberation, freedom, liberation_renunciation,
               renunciation
"""

import json
from pathlib import Path

REPO = Path("/home/user/MindVibe")
CORPUS = REPO / "data/gita/gita_verses_complete.json"

# UI theme ID → matching tags (mental_health_applications OR top-level theme)
THEME_TAGS: dict[str, set[str]] = {
    "peace": {
        "inner_peace", "mindfulness", "stress_reduction", "acceptance",
        "emotional_regulation", "anxiety_management",
    },
    "courage": {
        "resilience", "conflict_resolution", "purpose_and_meaning",
        "personal_growth",
    },
    "wisdom": {
        "self_knowledge", "self_awareness", "discernment", "self_discovery",
        "cognitive_awareness", "knowledge_wisdom",
    },
    "devotion": {
        "devotion", "self_compassion", "interconnection",
        "devotion_love", "divine_glories", "royal_knowledge",
    },
    "action": {
        "self_discipline", "integration", "selfless_action",
        "renunciation_action",
    },
    "detachment": {
        "letting_go", "liberation", "freedom",
        "liberation_renunciation", "renunciation",
    },
}


def verse_matches(verse: dict, target_tags: set[str]) -> bool:
    """A verse matches a theme if its theme OR any of its MHA tags is in the target set."""
    theme = verse.get("theme", "")
    if theme in target_tags:
        return True
    mha = set(verse.get("mental_health_applications", []))
    return bool(mha & target_tags)


def main() -> int:
    verses = json.loads(CORPUS.read_text(encoding="utf-8"))
    print(f"Loaded {len(verses)} verses from corpus")

    out: dict[str, list[str]] = {}
    for theme_id, target_tags in THEME_TAGS.items():
        matched_refs = [
            f"{v['chapter']}.{v['verse']}"
            for v in verses
            if verse_matches(v, target_tags)
        ]
        # Stable sort: by chapter then verse number
        matched_refs.sort(key=lambda r: tuple(int(x) for x in r.split(".")))
        out[theme_id] = matched_refs
        print(f"  {theme_id:12s} → {len(matched_refs):3d} verses")

    # Write to both the web data dir and the mobile API package
    targets = [
        REPO / "data/gita/themes.json",
        REPO / "kiaanverse-mobile/packages/api/src/gita-data/themes.json",
    ]
    for target in targets:
        target.write_text(
            json.dumps(out, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"\n  → wrote {target.relative_to(REPO)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
