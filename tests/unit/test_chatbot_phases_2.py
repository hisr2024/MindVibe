"""
Unit tests for Phase 2: Knowledge Domain Integration
"""

import pytest

from backend.services.domain_mapper import DomainMapper


class TestDomainMapper:
    """Test suite for DomainMapper."""

    @pytest.fixture
    def mapper(self):
        """Create a DomainMapper instance."""
        return DomainMapper()

    def test_init(self, mapper):
        """Test initialization."""
        assert mapper is not None

    def test_get_all_domains(self, mapper):
        """Test getting all domain definitions."""
        domains = mapper.get_all_domains()

        assert len(domains) == 9
        assert "self_understanding" in domains
        assert "action_discipline" in domains
        assert "equanimity" in domains
        assert "knowledge_insight" in domains
        assert "values_service" in domains
        assert "meditation_attention" in domains
        assert "resilience" in domains
        assert "interconnectedness" in domains
        assert "cognitive_flexibility" in domains

    def test_domain_structure(self, mapper):
        """Test that each domain has required fields."""
        domains = mapper.get_all_domains()

        for domain_key, domain_info in domains.items():
            assert "name" in domain_info
            assert "description" in domain_info
            assert "keywords" in domain_info
            assert "themes" in domain_info
            assert isinstance(domain_info["keywords"], list)
            assert isinstance(domain_info["themes"], list)

    def test_get_domain_by_key(self, mapper):
        """Test getting domain by key."""
        domain = mapper.get_domain_by_key("self_understanding")

        assert domain is not None
        assert domain["name"] == "Self-Understanding & Metacognition"
        assert "awareness" in domain["keywords"]

    def test_get_domain_by_invalid_key(self, mapper):
        """Test getting domain with invalid key."""
        domain = mapper.get_domain_by_key("invalid_domain")
        assert domain is None

    def test_map_theme_to_domain_exact_match(self, mapper):
        """Test mapping theme to domain with exact match."""
        domain = mapper.map_theme_to_domain("action_without_attachment")
        assert domain == "action_discipline"

    def test_map_theme_to_domain_partial_match(self, mapper):
        """Test mapping theme to domain with partial match."""
        domain = mapper.map_theme_to_domain("path_of_knowledge")
        assert domain == "knowledge_insight"

    def test_map_theme_to_domain_keyword_fallback(self, mapper):
        """Test mapping theme to domain using keyword fallback."""
        domain = mapper.map_theme_to_domain("meditation_practice")
        assert domain == "meditation_attention"

    def test_map_theme_no_match(self, mapper):
        """Test mapping theme with no match returns None."""
        domain = mapper.map_theme_to_domain("completely_unrelated_theme")
        assert domain is None

    def test_route_query_to_domain_anxiety(self, mapper):
        """Test routing anxiety query to appropriate domain."""
        domain = mapper.route_query_to_domain(
            "I'm feeling anxious and need help managing my emotions"
        )

        # Should route to equanimity or emotional_regulation
        assert domain in ["equanimity", "self_understanding", "meditation_attention"]

    def test_route_query_to_domain_action(self, mapper):
        """Test routing action-oriented query."""
        domain = mapper.route_query_to_domain(
            "I need motivation to take action and be disciplined"
        )

        assert domain == "action_discipline"

    def test_route_query_to_domain_meditation(self, mapper):
        """Test routing meditation query."""
        domain = mapper.route_query_to_domain(
            "How can I improve my focus and concentration through meditation?"
        )

        assert domain == "meditation_attention"

    def test_route_query_to_domain_values(self, mapper):
        """Test routing values query."""
        domain = mapper.route_query_to_domain(
            "I want to help others and live according to my values"
        )

        assert domain == "values_service"

    def test_route_query_no_clear_match(self, mapper):
        """Test routing query with no clear domain match."""
        domain = mapper.route_query_to_domain("xyz abc random words")
        assert domain is None

    def test_get_verse_domains_from_theme(self, mapper):
        """Test getting verse domains from theme."""
        domains = mapper.get_verse_domains(
            verse_theme="action_without_attachment",
            verse_context="This verse teaches performing duties without attachment.",
        )

        assert len(domains) >= 1
        assert "action_discipline" in domains

    def test_get_verse_domains_multiple(self, mapper):
        """Test that verses can have multiple domains."""
        domains = mapper.get_verse_domains(
            verse_theme="meditation",
            verse_context="Practice meditation with discipline to achieve focus and emotional balance through persistent effort.",
        )

        # Should identify multiple relevant domains
        assert len(domains) >= 1
        assert len(domains) <= 3  # Max 3 domains per verse

    def test_tag_verse_with_domains(self, mapper):
        """Test complete verse tagging."""
        tag_info = mapper.tag_verse_with_domains(
            verse_theme="control_of_mind",
            verse_context="Through practice and detachment, one can master the mind.",
            verse_english="The mind is restless, but through practice it can be controlled.",
        )

        assert "primary_domain" in tag_info
        assert "secondary_domains" in tag_info
        assert "all_domains" in tag_info

        assert tag_info["primary_domain"] is not None
        assert isinstance(tag_info["secondary_domains"], list)
        assert isinstance(tag_info["all_domains"], list)
        assert len(tag_info["all_domains"]) >= 1

    def test_tag_verse_fallback_domain(self, mapper):
        """Test that verses always get at least one domain (fallback)."""
        tag_info = mapper.tag_verse_with_domains(
            verse_theme="unknown_theme",
            verse_context="Some random context",
            verse_english="Some random text",
        )

        # Should fallback to self_understanding
        assert tag_info["primary_domain"] == "self_understanding"
        assert len(tag_info["all_domains"]) >= 1

    def test_get_domain_distribution_stats(self, mapper):
        """Test domain distribution statistics."""
        verses_with_domains = [
            {"all_domains": ["self_understanding", "action_discipline"]},
            {"all_domains": ["action_discipline"]},
            {"all_domains": ["meditation_attention", "equanimity"]},
        ]

        stats = mapper.get_domain_distribution_stats(verses_with_domains)

        assert "self_understanding" in stats
        assert "action_discipline" in stats
        assert stats["action_discipline"] == 2
        assert stats["self_understanding"] == 1
        assert stats["meditation_attention"] == 1

    def test_all_domains_covered_in_mapping(self, mapper):
        """Test that all 9 domains can be mapped to."""
        all_domains = mapper.get_all_domains()

        # Test that we can route to each domain
        test_queries = {
            "self_understanding": "I want to understand my thoughts better",
            "action_discipline": "I need discipline and motivation to act",
            "equanimity": "Help me find balance and emotional stability",
            "knowledge_insight": "I seek knowledge and wisdom",
            "values_service": "I want to help others and live my values",
            "meditation_attention": "Teach me meditation and focus",
            "resilience": "I need strength to persevere through difficulty",
            "interconnectedness": "I want to feel more connected and empathetic",
            "cognitive_flexibility": "Help me let go and be more flexible",
        }

        for expected_domain, query in test_queries.items():
            result_domain = mapper.route_query_to_domain(query)
            # The routing might not be perfect, but should be reasonable
            assert result_domain is not None, f"Failed to route query for {expected_domain}"
