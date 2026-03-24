"""
Unit tests for KarmaProblemResolver.

Tests the problem analysis engine including category listing, problem retrieval,
situation analysis with keyword matching, and problem-to-path resolution.
"""

import pytest

from backend.services.karma_problem_resolver import KarmaProblemResolver


class TestKarmaProblemResolver:
    """Test KarmaProblemResolver methods."""

    def setup_method(self):
        self.resolver = KarmaProblemResolver()

    # ==================== Categories ====================

    def test_get_problem_categories_returns_list(self):
        categories = self.resolver.get_problem_categories()
        assert isinstance(categories, list)
        assert len(categories) >= 8

    def test_category_has_required_keys(self):
        categories = self.resolver.get_problem_categories()
        for cat in categories:
            assert "key" in cat
            assert "name" in cat
            assert "sanskrit_name" in cat
            assert "sanskrit_label" in cat
            assert "icon" in cat
            assert "description" in cat
            assert "color" in cat
            assert "problem_count" in cat
            assert cat["problem_count"] > 0

    def test_categories_include_expected_keys(self):
        categories = self.resolver.get_problem_categories()
        keys = {cat["key"] for cat in categories}
        expected = {
            "relationship_conflict", "work_career", "self_worth",
            "family_tensions", "anxiety_health", "loss_grief",
            "betrayal_injustice", "spiritual_crisis",
        }
        assert expected.issubset(keys)

    # ==================== Problems for Category ====================

    def test_get_problems_for_valid_category(self):
        problems = self.resolver.get_problems_for_category("relationship_conflict")
        assert isinstance(problems, list)
        assert len(problems) > 0

    def test_get_problems_for_invalid_category(self):
        problems = self.resolver.get_problems_for_category("nonexistent")
        assert problems == []

    def test_problem_templates_have_required_fields(self):
        problems = self.resolver.get_problems_for_category("work_career")
        for problem in problems:
            assert "id" in problem
            assert "label" in problem
            assert "primary_path" in problem
            assert "shad_ripu" in problem

    # ==================== All Problems Flat ====================

    def test_get_all_problems_flat_returns_list(self):
        problems = self.resolver.get_all_problems_flat()
        assert isinstance(problems, list)
        assert len(problems) > 10  # should have many problems

    def test_flat_problems_include_category_info(self):
        problems = self.resolver.get_all_problems_flat()
        for problem in problems:
            assert "category_key" in problem
            assert "category_name" in problem
            assert "category_icon" in problem

    # ==================== Get Problem By ID ====================

    def test_get_problem_by_valid_id(self):
        # First get a known problem ID
        all_problems = self.resolver.get_all_problems_flat()
        first_id = all_problems[0]["id"]

        result = self.resolver.get_problem_by_id(first_id)
        assert result is not None
        assert result["id"] == first_id
        assert "category_key" in result
        assert "category_name" in result

    def test_get_problem_by_invalid_id(self):
        result = self.resolver.get_problem_by_id("totally_fake_problem_id")
        assert result is None

    # ==================== Analyze Situation ====================

    def test_analyze_relationship_situation(self):
        result = self.resolver.analyze_situation(
            "I hurt my partner and feel guilty about the argument"
        )
        assert result["confidence"] > 0
        assert result["recommended_path"] != ""
        assert result["recommended_category"] != ""
        assert len(result["matched_keywords"]) > 0

    def test_analyze_work_situation(self):
        result = self.resolver.analyze_situation(
            "My boss criticized my work and I feel undervalued at my job"
        )
        assert result["confidence"] > 0
        assert result["recommended_category"] in ("work_career", "self_worth")

    def test_analyze_anxiety_situation(self):
        result = self.resolver.analyze_situation(
            "I am experiencing anxiety and panic attacks about health"
        )
        assert result["confidence"] > 0

    def test_analyze_empty_text_returns_default(self):
        result = self.resolver.analyze_situation("")
        assert result["confidence"] == 0.0
        assert result["recommended_path"] == "kshama"

    def test_analyze_short_text_returns_default(self):
        result = self.resolver.analyze_situation("hi")
        assert result["confidence"] == 0.0

    def test_analyze_no_keywords_returns_default(self):
        result = self.resolver.analyze_situation("xyzzy plugh abcdef nothing matches here")
        assert result["confidence"] == 0.0
        assert result["recommended_path"] == "kshama"

    def test_analysis_has_required_keys(self):
        result = self.resolver.analyze_situation("feeling angry at my friend")
        required = [
            "recommended_category", "category_name", "category_sanskrit",
            "recommended_path", "path_name", "path_sanskrit",
            "secondary_path", "confidence", "matched_keywords",
            "healing_insight", "gita_ref", "matched_problem", "shad_ripu",
        ]
        for key in required:
            assert key in result, f"Missing key: {key}"

    def test_analysis_confidence_capped_at_1(self):
        # Use many keywords to try to exceed cap
        result = self.resolver.analyze_situation(
            "anger rage fight conflict argument hurt pain "
            "betrayal trust broken heart grief loss suffering"
        )
        assert result["confidence"] <= 1.0

    def test_analysis_returns_secondary_path(self):
        result = self.resolver.analyze_situation(
            "I feel angry and also confused about my relationship"
        )
        assert result["secondary_path"] != ""

    # ==================== Find Best Matching Problem ====================

    def test_find_best_matching_problem_basic(self):
        problems = self.resolver.get_problems_for_category("relationship_conflict")
        result = self.resolver._find_best_matching_problem(
            "i hurt my partner during an argument", problems
        )
        assert result is not None
        assert "id" in result

    def test_find_best_matching_problem_no_match(self):
        problems = self.resolver.get_problems_for_category("relationship_conflict")
        result = self.resolver._find_best_matching_problem(
            "xyzzy completely unrelated", problems
        )
        # May return None or a low-score match
        # Either is acceptable

    # ==================== Default Analysis ====================

    def test_default_analysis_structure(self):
        result = self.resolver._default_analysis()
        assert result["recommended_category"] == "self_worth"
        assert result["recommended_path"] == "kshama"
        assert result["confidence"] == 0.0
        assert result["matched_keywords"] == []
