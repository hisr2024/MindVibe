"""
Domain Mapper Service

Maps wisdom verses to 9 psychological domains and provides semantic routing.

9 Psychological Domains:
1. Self-understanding & metacognition (awareness of mind)
2. Action, discipline & purpose (behavioral activation, motivation)
3. Equanimity & emotional regulation (balance, detachment)
4. Knowledge vs. ignorance (psychoeducation, insight)
5. Duty, ethics & service (values, social connection)
6. Meditation & attention training (focus, impulse control)
7. Faith, perseverance & resilience (sustained effort, self-trust)
8. Divine vision / interconnectedness (systems thinking, empathy)
9. Liberation / cognitive flexibility (detachment from rumination)
"""

from typing import Any


class DomainMapper:
    """Maps verses to psychological domains and routes queries."""

    # Define the 9 psychological domains
    DOMAINS = {
        "self_understanding": {
            "name": "Self-Understanding & Metacognition",
            "description": "Awareness of mind, recognizing thought patterns, self-awareness",
            "keywords": [
                "awareness",
                "mind",
                "thoughts",
                "consciousness",
                "understanding self",
                "introspection",
                "metacognition",
                "self-reflection",
            ],
            "themes": [
                "self_knowledge",
                "awareness_of_mind",
                "understanding_nature",
                "discrimination",
            ],
        },
        "action_discipline": {
            "name": "Action, Discipline & Purpose",
            "description": "Behavioral activation, motivation, purposeful action, discipline",
            "keywords": [
                "action",
                "discipline",
                "duty",
                "work",
                "effort",
                "practice",
                "motivation",
                "purpose",
                "commitment",
            ],
            "themes": [
                "action_without_attachment",
                "selfless_action",
                "path_of_action",
                "discipline",
                "dedicated_practice",
            ],
        },
        "equanimity": {
            "name": "Equanimity & Emotional Regulation",
            "description": "Balance, emotional stability, detachment from outcomes",
            "keywords": [
                "equanimity",
                "balance",
                "calm",
                "stability",
                "detachment",
                "emotional regulation",
                "acceptance",
                "non-reactivity",
            ],
            "themes": [
                "equanimity_in_adversity",
                "transcending_dualities",
                "emotional_stability",
                "balanced_mind",
            ],
        },
        "knowledge_insight": {
            "name": "Knowledge & Insight",
            "description": "Psychoeducation, understanding, wisdom, insight",
            "keywords": [
                "knowledge",
                "wisdom",
                "understanding",
                "learning",
                "insight",
                "clarity",
                "truth",
                "discernment",
            ],
            "themes": [
                "path_of_knowledge",
                "wisdom",
                "understanding",
                "true_knowledge",
            ],
        },
        "values_service": {
            "name": "Values, Ethics & Service",
            "description": "Personal values, social connection, service to others, ethics",
            "keywords": [
                "values",
                "service",
                "compassion",
                "kindness",
                "ethics",
                "helping others",
                "connection",
                "altruism",
            ],
            "themes": [
                "devotion_and_service",
                "compassion",
                "service_to_others",
                "ethical_living",
            ],
        },
        "meditation_attention": {
            "name": "Meditation & Attention Training",
            "description": "Focus, concentration, impulse control, mindfulness practice",
            "keywords": [
                "meditation",
                "focus",
                "concentration",
                "attention",
                "mindfulness",
                "practice",
                "breath",
                "present moment",
            ],
            "themes": [
                "control_of_mind",
                "meditation",
                "mastering_the_mind",
                "focused_attention",
            ],
        },
        "resilience": {
            "name": "Resilience & Perseverance",
            "description": "Sustained effort, self-trust, perseverance through difficulty",
            "keywords": [
                "perseverance",
                "resilience",
                "persistence",
                "endurance",
                "strength",
                "courage",
                "faith in self",
                "trust",
            ],
            "themes": [
                "overcoming_adversity",
                "inner_strength",
                "perseverance",
                "steadfastness",
            ],
        },
        "interconnectedness": {
            "name": "Interconnectedness & Systems Thinking",
            "description": "Understanding connections, empathy, systems perspective",
            "keywords": [
                "interconnection",
                "empathy",
                "unity",
                "oneness",
                "systems thinking",
                "relationships",
                "connection",
                "wholeness",
            ],
            "themes": [
                "universal_connection",
                "seeing_the_whole",
                "empathy",
                "interconnectedness",
            ],
        },
        "cognitive_flexibility": {
            "name": "Cognitive Flexibility & Liberation",
            "description": "Detachment from rumination, mental flexibility, letting go",
            "keywords": [
                "flexibility",
                "letting go",
                "detachment",
                "freedom",
                "liberation",
                "non-attachment",
                "adaptability",
                "release",
            ],
            "themes": [
                "renunciation",
                "letting_go",
                "freedom_from_bondage",
                "mental_flexibility",
            ],
        },
    }

    def __init__(self) -> None:
        """Initialize the domain mapper."""
        pass

    def get_all_domains(self) -> dict[str, dict[str, Any]]:
        """
        Get all domain definitions.

        Returns:
            Dictionary of all domains with their metadata
        """
        return self.DOMAINS

    def get_domain_by_key(self, domain_key: str) -> dict[str, Any] | None:
        """
        Get domain definition by key.

        Args:
            domain_key: Domain key (e.g., "self_understanding")

        Returns:
            Domain definition or None if not found
        """
        return self.DOMAINS.get(domain_key)

    def map_theme_to_domain(self, theme: str) -> str | None:
        """
        Map a theme to its primary psychological domain.

        Args:
            theme: Theme name

        Returns:
            Domain key or None if no mapping found
        """
        theme_lower = theme.lower()

        # Check each domain's themes
        for domain_key, domain_info in self.DOMAINS.items():
            domain_themes = domain_info.get("themes", [])
            for domain_theme in domain_themes:
                if domain_theme.lower() in theme_lower or theme_lower in domain_theme.lower():
                    return domain_key

        # Fallback: check for keyword matches
        for domain_key, domain_info in self.DOMAINS.items():
            keywords = domain_info.get("keywords", [])
            for keyword in keywords:
                if keyword.lower() in theme_lower:
                    return domain_key

        return None

    def route_query_to_domain(self, query: str) -> str | None:
        """
        Route a user query to the most relevant psychological domain.

        Args:
            query: User's query text

        Returns:
            Domain key or None if no clear match
        """
        query_lower = query.lower()
        scores = {}

        # Additional query-specific patterns
        query_patterns = {
            "self_understanding": ["understand myself", "understand my", "know myself", "thoughts better", "self-awareness", "self awareness"],
            "action_discipline": ["discipline", "motivation", "take action", "need to act", "get things done", "be productive"],
            "equanimity": ["anxious", "anxiety", "balance", "stability", "emotional", "calm down", "manage emotions", "worried", "fear"],
            "knowledge_insight": ["knowledge", "wisdom", "learn", "understand", "insight", "teach me"],
            "values_service": ["help others", "live my values", "values", "service", "giving back", "contribute"],
            "meditation_attention": ["meditation", "meditate", "focus", "concentration", "attention", "mindfulness", "be present"],
            "resilience": ["persevere", "keep going", "strength", "difficulty", "challenge", "tough times", "resilience"],
            "interconnectedness": ["connected", "connection", "empathy", "empathetic", "relationships", "unity", "wholeness", "feel alone"],
            "cognitive_flexibility": ["let go", "letting go", "stuck", "rigid", "flexible", "adapt", "change perspective"],
        }

        # Score each domain based on keyword matches
        for domain_key, domain_info in self.DOMAINS.items():
            score = 0
            keywords = domain_info.get("keywords", [])

            # Check domain keywords
            for keyword in keywords:
                if keyword.lower() in query_lower:
                    # Weight longer keywords more heavily
                    score += len(keyword.split()) * 2

            # Check query-specific patterns (higher weight)
            if domain_key in query_patterns:
                for pattern in query_patterns[domain_key]:
                    if pattern.lower() in query_lower:
                        score += len(pattern.split()) * 3

            scores[domain_key] = score

        # Return domain with highest score, or None if all scores are 0
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)  # type: ignore[arg-type, return-value]

        return None

    def get_verse_domains(self, verse_theme: str, verse_context: str) -> list[str]:
        """
        Determine which domains a verse belongs to.

        Args:
            verse_theme: Verse theme
            verse_context: Verse context

        Returns:
            List of domain keys (1-3 domains per verse)
        """
        domains = []

        # Primary domain from theme
        primary_domain = self.map_theme_to_domain(verse_theme)
        if primary_domain:
            domains.append(primary_domain)

        # Check context for additional domains
        context_lower = verse_context.lower()

        for domain_key, domain_info in self.DOMAINS.items():
            if domain_key in domains:
                continue  # Skip if already added

            keywords = domain_info.get("keywords", [])
            matches = sum(1 for kw in keywords if kw.lower() in context_lower)

            # Add domain if significant keyword matches (2+ keywords)
            if matches >= 2:
                domains.append(domain_key)

            # Limit to 3 domains per verse
            if len(domains) >= 3:
                break

        return domains

    def tag_verse_with_domains(
        self, verse_theme: str, verse_context: str, verse_english: str
    ) -> dict[str, Any]:
        """
        Tag a verse with relevant psychological domains.

        Args:
            verse_theme: Verse theme
            verse_context: Verse context
            verse_english: Verse English text

        Returns:
            Dictionary with domain tagging information
        """
        # Get domains from theme and context
        domains = self.get_verse_domains(verse_theme, verse_context)

        # If no domains found, try the English text
        if not domains:
            for domain_key, domain_info in self.DOMAINS.items():
                keywords = domain_info.get("keywords", [])
                matches = sum(1 for kw in keywords if kw.lower() in verse_english.lower())
                if matches >= 2:
                    domains.append(domain_key)
                    if len(domains) >= 3:
                        break

        # Ensure at least one domain (fallback to self_understanding)
        if not domains:
            domains = ["self_understanding"]

        return {
            "primary_domain": domains[0] if domains else "self_understanding",
            "secondary_domains": domains[1:] if len(domains) > 1 else [],
            "all_domains": domains,
        }

    def get_domain_distribution_stats(
        self, verses_with_domains: list[dict[str, Any]]
    ) -> dict[str, int]:
        """
        Get statistics on domain distribution across verses.

        Args:
            verses_with_domains: List of verses with domain tags

        Returns:
            Dictionary with domain counts
        """
        stats = {domain_key: 0 for domain_key in self.DOMAINS.keys()}

        for verse_data in verses_with_domains:
            domains = verse_data.get("all_domains", [])
            for domain in domains:
                if domain in stats:
                    stats[domain] += 1

        return stats
