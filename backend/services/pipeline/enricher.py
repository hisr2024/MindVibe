"""Metadata enrichment module for the pipeline."""

import re
from typing import Any


class MetadataEnricher:
    """Enriches verse data with metadata and additional information."""
    
    # Mental health application keywords
    APPLICATION_KEYWORDS = {
        "anxiety_management": ["anxiety", "worry", "fear", "nervous"],
        "stress_reduction": ["stress", "calm", "relax", "peace"],
        "emotional_regulation": ["emotion", "feeling", "mood", "balance"],
        "depression_support": ["depression", "sadness", "despair", "hopeless"],
        "anger_management": ["anger", "rage", "fury", "frustration"],
        "self_esteem": ["confidence", "self", "worth", "value"],
    }
    
    @classmethod
    def extract_principles(cls, verse: dict) -> list[str]:
        """
        Extract key principles from verse content.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            List of principle keywords
        """
        text = " ".join([
            verse.get("english", ""),
            verse.get("context", ""),
            verse.get("theme", ""),
        ]).lower()
        
        # Common principle keywords
        principle_keywords = [
            "action", "duty", "detachment", "peace", "wisdom",
            "knowledge", "meditation", "discipline", "devotion",
            "equanimity", "compassion", "selflessness", "mindfulness"
        ]
        
        found_principles = [kw for kw in principle_keywords if kw in text]
        return found_principles
    
    @classmethod
    def extract_keywords(cls, verse: dict) -> list[str]:
        """
        Extract important keywords from verse text.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            List of keywords
        """
        text = " ".join([
            verse.get("english", ""),
            verse.get("context", ""),
        ]).lower()
        
        # Remove punctuation and split into words
        words = re.findall(r'\b\w+\b', text)
        
        # Filter out common words and keep meaningful ones (> 4 chars)
        stop_words = {"the", "and", "that", "this", "with", "from", "your", "about", "through"}
        keywords = [w for w in words if len(w) > 4 and w not in stop_words]
        
        # Return unique keywords
        return list(set(keywords))[:10]  # Limit to top 10
    
    @classmethod
    def suggest_applications(cls, verse: dict) -> list[str]:
        """
        Suggest mental health applications based on content.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            List of suggested application names
        """
        text = " ".join([
            verse.get("english", ""),
            verse.get("context", ""),
        ]).lower()
        
        suggestions = []
        for app_name, keywords in cls.APPLICATION_KEYWORDS.items():
            if any(kw in text for kw in keywords):
                suggestions.append(app_name)
        
        return suggestions
    
    @classmethod
    def create_searchable_text(cls, verse: dict) -> str:
        """
        Create combined searchable text from all verse fields.
        
        Args:
            verse: Verse dictionary
            
        Returns:
            Combined searchable text
        """
        parts = []
        
        # Add text fields
        for field in ["english", "hindi", "context"]:
            if field in verse and verse[field]:
                parts.append(verse[field])
        
        # Add theme
        if "theme" in verse:
            parts.append(verse["theme"].replace("_", " "))
        
        # Add applications
        if "mental_health_applications" in verse:
            apps = verse["mental_health_applications"]
            if isinstance(apps, dict):
                parts.extend(apps.get("applications", []))
            elif isinstance(apps, list):
                parts.extend(apps)
        
        return " ".join(parts)
    
    @classmethod
    def enrich(cls, verse: dict) -> dict:
        """
        Enrich verse with additional metadata.
        
        Args:
            verse: Verse dictionary to enrich
            
        Returns:
            Enriched verse dictionary
        """
        result = verse.copy()
        
        # Add principles
        result["principles"] = cls.extract_principles(verse)
        
        # Add keywords
        result["keywords"] = cls.extract_keywords(verse)
        
        # Add searchable text
        result["searchable_text"] = cls.create_searchable_text(verse)
        
        # Suggest applications if not present or empty
        if "mental_health_applications" not in result or not result["mental_health_applications"]:
            suggestions = cls.suggest_applications(verse)
            result["suggested_applications"] = suggestions
        
        return result
