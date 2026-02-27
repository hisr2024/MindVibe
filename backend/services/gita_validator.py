"""
Gita Response Validation Service.

Validates that KIAAN's responses are properly rooted in Bhagavad Gita wisdom
and follow the required structure and terminology.
"""

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


class GitaValidator:
    """Validator for ensuring responses are rooted in Gita wisdom.

    v5.0: Enhanced with Five Pillar compliance scoring for deep Gita adherence:
    1. Atman-Prakriti Viveka (Self vs Mind distinction)
    2. Phala-tyaga (Complete fruit renunciation)
    3. Samatvam (Equanimity in all dualities)
    4. Ahamkara Dissolution (Ego transcendence)
    5. Ishvara-arpana (Surrender to the Divine)
    """

    # Required Sanskrit/Gita terminology that should appear in responses
    GITA_TERMS = [
        "dharma", "karma", "atman", "yoga", "moksha", "sattva", "rajas", "tamas",
        "prakriti", "purusha", "guna", "buddhi", "manas", "chitta", "ahimsa",
        "tapas", "swadhyaya", "ishvara", "sannyasa", "tyaga", "bhakti", "jnana",
        "dhyana", "samadhi", "nishkama", "vairagya", "viveka", "shraddha",
        "devotion", "detachment", "equanimity", "duty", "action", "knowledge",
        "wisdom", "peace", "balance", "surrender", "awareness", "consciousness",
        "inner self", "higher self", "essence", "purpose", "discipline",
        "witness", "observer", "sakshi", "ahamkara", "offering",
    ]

    # Forbidden generic/non-Gita terms that indicate generic advice
    FORBIDDEN_TERMS = [
        "studies show", "research indicates", "according to research",
        "scientists say", "experts recommend", "data suggests",
        "modern psychology", "clinical studies", "proven by science",
        "psychologists agree", "therapy suggests", "medical advice",
        "consult a doctor", "seek professional help", "talk to a therapist"
    ]

    # Structural markers that indicate Gita-based wisdom
    WISDOM_MARKERS = [
        "ancient wisdom", "timeless teaching", "universal principle",
        "eternal truth", "path to", "journey of", "practice of",
        "cultivate", "embrace", "release", "let go", "transcend",
        "inner peace", "self-mastery", "spiritual growth"
    ]

    # Five Pillar compliance markers (v5.0)
    # Each pillar has both Gita-mode and secular-mode indicators
    PILLAR_MARKERS = {
        "atman_prakriti": {
            "gita": [
                "atman", "prakriti", "witness", "witnessing", "observer",
                "sakshi", "knower of the field", "not the body", "not the mind",
                "unchanging", "consciousness", "self",
            ],
            "secular": [
                "not your anxiety", "not your performance", "aware of",
                "watching", "observing", "notice the worry", "underneath",
                "the person observing", "awareness", "still here",
                "doesn't change", "who you are beyond", "core self",
            ],
        },
        "phala_tyaga": {
            "gita": [
                "renounce", "fruits", "phala", "tyaga", "release the claim",
                "nishkama", "desireless", "offering", "no claim",
                "without attachment", "without expectation",
            ],
            "secular": [
                "release", "let go of the result", "not yours to hold",
                "contribution", "not a strategy for winning", "action is complete",
                "no bargaining", "silent hope", "subtle craving",
                "done your part", "not entitled",
            ],
        },
        "samatvam": {
            "gita": [
                "equanimity", "samatva", "equal mind", "steady",
                "balanced in success and failure", "praise and blame",
                "honor and disgrace", "sthitaprajna", "unmoved",
            ],
            "secular": [
                "both outcomes", "success and failure", "either way",
                "remain steady", "equally", "whether it works or not",
                "praise or blame", "positive or negative",
                "undisturbed", "composure",
            ],
        },
        "ahamkara": {
            "gita": [
                "ahamkara", "ego", "doer", "gunas of prakriti",
                "i do nothing", "doership", "nature performs",
                "deluded", "not the doer",
            ],
            "secular": [
                "my reputation", "my image", "my worth",
                "ego", "identity at stake", "about you",
                "says about you", "performer", "person from the performance",
                "not about your competence", "separate",
            ],
        },
        "ishvara_arpana": {
            "gita": [
                "surrender", "offering", "prasad", "ishvara",
                "larger order", "divine", "offer the action",
                "belongs to the lord", "sacred offering",
            ],
            "secular": [
                "let the situation unfold", "beyond your control",
                "release to something larger", "done your part",
                "let it go", "unfold as it will", "trust the process",
                "many factors", "not one person's to control",
            ],
        },
    }

    # Minimum and maximum word counts
    MIN_WORDS = 200
    MAX_WORDS = 500
    
    # Compile citation patterns once at class level for performance
    CITATION_PATTERNS = [
        re.compile(r'bhagavad gita \d+\.\d+'),
        re.compile(r'gita \d+\.\d+'),
        re.compile(r'chapter \d+ verse \d+'),
        re.compile(r'verse \d+\.\d+'),
        re.compile(r'krishna said in chapter'),
    ]

    def __init__(self):
        """Initialize the Gita validator."""
        self.logger = logger

    def validate_response(
        self,
        response: str,
        verse_context: list[dict[str, Any]] | None = None
    ) -> tuple[bool, dict[str, Any]]:
        """
        Validate that a response meets Gita adherence requirements.
        
        Args:
            response: The chatbot response to validate
            verse_context: Optional list of verse dictionaries that were used
            
        Returns:
            Tuple of (is_valid, validation_details)
            - is_valid: Boolean indicating if validation passed
            - validation_details: Dict with detailed validation results
        """
        validation_details = {
            "has_gita_terminology": False,
            "no_forbidden_terms": True,
            "has_wisdom_markers": False,
            "appropriate_length": False,
            "verse_context_used": False,
            "gita_terms_found": [],
            "forbidden_terms_found": [],
            "wisdom_markers_found": [],
            "word_count": 0,
            "issues": []
        }

        if not response or not response.strip():
            validation_details["issues"].append("Response is empty")
            return False, validation_details

        # Clean response for analysis
        response_lower = response.lower()

        # 1. Check word count
        words = response.split()
        word_count = len(words)
        validation_details["word_count"] = word_count

        if self.MIN_WORDS <= word_count <= self.MAX_WORDS:
            validation_details["appropriate_length"] = True
        else:
            validation_details["issues"].append(
                f"Word count {word_count} not in range {self.MIN_WORDS}-{self.MAX_WORDS}"
            )

        # 2. Check for Gita terminology (at least 2 terms required)
        gita_terms_found = []
        for term in self.GITA_TERMS:
            if term.lower() in response_lower:
                gita_terms_found.append(term)

        validation_details["gita_terms_found"] = gita_terms_found
        if len(gita_terms_found) >= 2:
            validation_details["has_gita_terminology"] = True
        else:
            validation_details["issues"].append(
                f"Only {len(gita_terms_found)} Gita terms found, need at least 2"
            )

        # 3. Check for forbidden generic terms
        forbidden_found = []
        for term in self.FORBIDDEN_TERMS:
            if term.lower() in response_lower:
                forbidden_found.append(term)

        validation_details["forbidden_terms_found"] = forbidden_found
        if forbidden_found:
            validation_details["no_forbidden_terms"] = False
            validation_details["issues"].append(
                f"Contains forbidden terms: {', '.join(forbidden_found)}"
            )

        # 4. Check for wisdom markers (at least 1 required)
        wisdom_markers_found = []
        for marker in self.WISDOM_MARKERS:
            if marker.lower() in response_lower:
                wisdom_markers_found.append(marker)

        validation_details["wisdom_markers_found"] = wisdom_markers_found
        if wisdom_markers_found:
            validation_details["has_wisdom_markers"] = True
        else:
            validation_details["issues"].append(
                "No wisdom markers found in response"
            )

        # 5. Check if verse context was provided and used
        if verse_context and len(verse_context) > 0:
            validation_details["verse_context_used"] = True
        else:
            validation_details["issues"].append(
                "No verse context provided or empty"
            )

        # 6. Additional check: Ensure response doesn't explicitly cite verses
        # This is important - we want to use wisdom but not cite it
        for pattern in self.CITATION_PATTERNS:
            if pattern.search(response_lower):
                validation_details["issues"].append(
                    f"Response contains explicit verse citation: {pattern.pattern}"
                )
                validation_details["no_forbidden_terms"] = False

        # Determine overall validity
        is_valid = (
            validation_details["has_gita_terminology"] and
            validation_details["no_forbidden_terms"] and
            validation_details["has_wisdom_markers"] and
            validation_details["appropriate_length"] and
            validation_details["verse_context_used"]
        )

        if is_valid:
            self.logger.info("✅ Response validation passed")
        else:
            self.logger.warning(
                f"❌ Response validation failed: {', '.join(validation_details['issues'])}"
            )

        return is_valid, validation_details

    def get_fallback_response(self, user_message: str = "") -> str:
        """
        Get a Gita-rooted fallback response when validation fails.
        
        Args:
            user_message: Optional user message for context
            
        Returns:
            A safe, Gita-based response
        """
        fallback_responses = [
            """In times of uncertainty, the ancient wisdom offers a fundamental truth: you are not the anxiety, not the outcome, not the situation — you are the witness of it all. The atman within you remains untouched by temporary results. This is not philosophy but practical reality: the awareness watching your worry right now does not change based on what happens next.

The path of karma yoga teaches complete release — not merely focusing on effort, but renouncing all claim over the outcome. Your right was to the action alone. You performed it. The result belongs to a larger order. Even subtle hope for a positive outcome is still attachment. Release it. Act fully, offer the action, and let the result unfold as it will.

The Gita's standard of equanimity is high: can you remain inwardly steady whether this succeeds or fails? Whether praise comes or blame? The one of steady wisdom — the sthitaprajna — treats honor and disgrace with equal mind. This steadiness is not indifference; it is strength rooted in knowing who you truly are beyond any result.

Start today with one practice: before any task, pause and recognize — "I am the awareness watching this situation. The outcome belongs to prakriti, to circumstance. I offer this action as my contribution and release the rest." This discipline of surrender transforms ordinary actions into sacred offerings and brings unshakeable equanimity to daily life.""",

            """The ancient teachings reveal something profound: all actions are performed by the gunas of prakriti — nature acts through you. The self, deluded by ahamkara (ego), mistakenly thinks "I am the doer." When you see this clearly — that "my performance" and "my reputation" belong to the body-mind instrument, not to the eternal witness within — anxiety loses its grip.

Begin by bringing awareness to WHO is anxious. Is it you — the unchanging consciousness — or is it the mind? Notice the worry as something arising in the field of experience while you, the knower of the field, remain untouched. This practice of sakshi bhava (witness consciousness) is the foundation of lasting peace.

The path of wisdom demands that we prepare for both outcomes with equal mind. If this succeeds, remain steady. If this fails, remain steady. The Gita teaches: balanced in success and failure, that equanimity is called yoga. Not because outcomes don't matter, but because your deepest identity does not depend on them.

The path forward is surrender: "This duty is my offering. I prepare with full sincerity. The result belongs to the Lord. Praise and criticism are His prasad. I remain steady." When you offer the action completely, there is nothing left to worry about. The offering was your dharma. The fruit was never yours.""",

            """True peace comes from recognizing your identity as the eternal witness — the atman that watches all experiences without being changed by them. You are not your thoughts, not your achievements, not your failures. You are the aware presence that observes them all.

This recognition begins with a simple shift: when anxiety arises, notice it as something happening IN you, not AS you. The worry about outcomes belongs to the mind — to prakriti. But you, the witness, remain unchanged regardless of what unfolds. This is the Gita's deepest teaching: the unreal has no existence, and the real never ceases to be.

The timeless path requires complete fruit-renunciation — not just effort-focus but true release of all claim. Your action was your offering. Once offered, it is no longer yours to worry about. Even hoping quietly for a good result is attachment that binds. The wise know: "I do nothing at all" — action flows through the body-mind while the Self witnesses.

Remember: you are the knower of the field, not the field itself. Cultivate this witness awareness. When someone praises you, remain steady. When someone criticizes you, remain steady. Offer every action as a sacred offering and release the result to a larger order. This surrender is not weakness — it is the highest strength, rooted in knowledge of who you truly are."""
        ]

        # Simple hash to pick a consistent response based on message
        import hashlib
        if user_message:
            # SECURITY: Use sha256 instead of md5 for consistency
            hash_val = int(hashlib.sha256(user_message.encode()).hexdigest(), 16)
            index = hash_val % len(fallback_responses)
        else:
            index = 0

        return fallback_responses[index]

    def score_five_pillar_compliance(
        self,
        response: str,
        secular_mode: bool = True,
    ) -> dict[str, Any]:
        """Score response against the Five Pillars of deep Gita compliance.

        Each pillar is scored 0.0-1.0 based on presence of relevant markers.
        Overall compliance score is the average across all five pillars.

        Args:
            response: The response to evaluate
            secular_mode: If True, use secular markers; if False, use Gita markers

        Returns:
            Dict with per-pillar scores, overall score, and details
        """
        response_lower = response.lower()
        mode_key = "secular" if secular_mode else "gita"

        pillar_scores: dict[str, float] = {}
        pillar_details: dict[str, list[str]] = {}

        for pillar_name, markers_by_mode in self.PILLAR_MARKERS.items():
            markers = markers_by_mode.get(mode_key, [])
            found = []
            for marker in markers:
                if marker.lower() in response_lower:
                    found.append(marker)

            # Score: 0.0 if none found, up to 1.0 based on how many markers hit
            if not markers:
                score = 0.0
            elif len(found) >= 3:
                score = 1.0
            elif len(found) == 2:
                score = 0.7
            elif len(found) == 1:
                score = 0.4
            else:
                score = 0.0

            pillar_scores[pillar_name] = score
            pillar_details[pillar_name] = found

        # Overall compliance score (average of all five pillars)
        overall_score = sum(pillar_scores.values()) / len(pillar_scores) if pillar_scores else 0.0

        # Determine compliance level
        if overall_score >= 0.8:
            compliance_level = "10/10"
        elif overall_score >= 0.6:
            compliance_level = "8/10"
        elif overall_score >= 0.4:
            compliance_level = "6/10"
        elif overall_score >= 0.2:
            compliance_level = "4/10"
        else:
            compliance_level = "2/10"

        # Identify missing pillars (score < 0.4)
        missing_pillars = [
            name for name, score in pillar_scores.items() if score < 0.4
        ]

        # Identify strong pillars (score >= 0.7)
        strong_pillars = [
            name for name, score in pillar_scores.items() if score >= 0.7
        ]

        result = {
            "overall_score": round(overall_score, 2),
            "compliance_level": compliance_level,
            "pillar_scores": {k: round(v, 2) for k, v in pillar_scores.items()},
            "pillar_details": pillar_details,
            "missing_pillars": missing_pillars,
            "strong_pillars": strong_pillars,
            "pillars_met": len([s for s in pillar_scores.values() if s >= 0.4]),
            "total_pillars": 5,
        }

        self.logger.info(
            f"Five Pillar compliance: {compliance_level} "
            f"(score={overall_score:.2f}, met={result['pillars_met']}/5, "
            f"missing={missing_pillars})"
        )

        return result

    def check_four_part_structure(self, response: str) -> dict[str, bool]:
        """
        Check if response follows the 4-part structure:
        1. Ancient Wisdom
        2. Modern Application
        3. Practical Steps
        4. Deeper Understanding

        Args:
            response: The response to check

        Returns:
            Dict indicating which parts are present
        """
        response_lower = response.lower()

        structure = {
            "has_ancient_wisdom": False,
            "has_modern_application": False,
            "has_practical_steps": False,
            "has_deeper_understanding": False
        }

        # Ancient wisdom markers
        ancient_markers = [
            "wisdom", "ancient", "timeless", "eternal", "teaching",
            "principle", "path", "tradition"
        ]
        structure["has_ancient_wisdom"] = any(
            marker in response_lower for marker in ancient_markers
        )

        # Modern application markers
        modern_markers = [
            "today", "now", "modern", "daily life", "your life",
            "in practice", "real world", "everyday"
        ]
        structure["has_modern_application"] = any(
            marker in response_lower for marker in modern_markers
        )

        # Practical steps markers (actionable language)
        practical_markers = [
            "start", "begin", "practice", "try", "take", "make",
            "create", "build", "develop", "cultivate", "step"
        ]
        structure["has_practical_steps"] = any(
            marker in response_lower for marker in practical_markers
        )

        # Deeper understanding markers
        deeper_markers = [
            "remember", "understand", "realize", "recognize", "see that",
            "know that", "trust", "deeper", "profound", "essence"
        ]
        structure["has_deeper_understanding"] = any(
            marker in response_lower for marker in deeper_markers
        )

        return structure
