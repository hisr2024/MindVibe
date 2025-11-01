"""
Metadata Enricher Module

Enriches verse data with additional metadata for enhanced searchability
and context-aware applications.
"""

from typing import Dict, List, Optional, Set, Any
import re


class MetadataEnricher:
    """
    Enriches verse data with additional metadata and tags.
    
    Analyzes verse content to extract themes, principles, and keywords
    for improved semantic search and categorization.
    """
    
    # Principle mappings from themes and keywords
    PRINCIPLE_KEYWORDS = {
        'detachment': ['attachment', 'detach', 'letting go', 'release', 'surrender'],
        'equanimity': ['equanimity', 'balance', 'steady', 'calm', 'undisturbed', 'peace'],
        'duty': ['duty', 'responsibility', 'obligation', 'dharma', 'right action'],
        'self_knowledge': ['self', 'know yourself', 'inner', 'awareness', 'consciousness'],
        'action': ['action', 'work', 'perform', 'karma', 'doing'],
        'wisdom': ['wisdom', 'knowledge', 'understanding', 'insight', 'discernment'],
        'devotion': ['devotion', 'dedication', 'commitment', 'surrender', 'faith'],
        'moderation': ['moderation', 'balance', 'middle path', 'neither too much'],
        'discipline': ['discipline', 'practice', 'training', 'control', 'mastery'],
        'compassion': ['compassion', 'kindness', 'love', 'care', 'empathy'],
    }
    
    # Mental health themes to keyword mappings
    MENTAL_HEALTH_KEYWORDS = {
        'anxiety_management': ['anxiety', 'worry', 'fear', 'nervous', 'tension'],
        'stress_reduction': ['stress', 'pressure', 'overwhelm', 'burden', 'strain'],
        'emotional_regulation': ['emotion', 'feeling', 'control', 'regulate', 'manage'],
        'mindfulness': ['present', 'moment', 'awareness', 'attention', 'mindful'],
        'resilience': ['resilient', 'strong', 'overcome', 'endure', 'persevere'],
        'self_empowerment': ['power', 'strength', 'capable', 'can', 'empower'],
        'acceptance': ['accept', 'acknowledge', 'embrace', 'allow', 'receive'],
        'letting_go': ['let go', 'release', 'detach', 'free', 'liberation'],
    }
    
    @classmethod
    def enrich(cls, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich verse data with additional metadata.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Enriched verse data with additional metadata
        """
        enriched = verse_data.copy()
        
        # Extract principles from content
        if 'principles' not in enriched:
            enriched['principles'] = cls.extract_principles(verse_data)
        
        # Extract keywords for search
        if 'keywords' not in enriched:
            enriched['keywords'] = cls.extract_keywords(verse_data)
        
        # Suggest additional mental health applications based on content
        if 'suggested_applications' not in enriched:
            enriched['suggested_applications'] = cls.suggest_applications(verse_data)
        
        # Add searchable text combining all translations
        if 'searchable_text' not in enriched:
            enriched['searchable_text'] = cls.create_searchable_text(verse_data)
        
        return enriched
    
    @classmethod
    def extract_principles(cls, verse_data: Dict[str, Any]) -> List[str]:
        """
        Extract philosophical principles from verse content.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            List of identified principles
        """
        principles = set()
        
        # Combine text fields for analysis
        text_to_analyze = ' '.join([
            verse_data.get('english', ''),
            verse_data.get('context', ''),
            verse_data.get('theme', ''),
        ]).lower()
        
        # Check for principle keywords
        for principle, keywords in cls.PRINCIPLE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_to_analyze:
                    principles.add(principle)
                    break
        
        return sorted(list(principles))
    
    @classmethod
    def extract_keywords(cls, verse_data: Dict[str, Any]) -> List[str]:
        """
        Extract important keywords from verse for search optimization.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            List of keywords
        """
        keywords = set()
        
        # Get text from English translation and context
        text = ' '.join([
            verse_data.get('english', ''),
            verse_data.get('context', ''),
        ])
        
        # Extract words (remove common stop words)
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
            'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
        }
        
        # Extract words
        words = re.findall(r'\b[a-z]+\b', text.lower())
        
        # Filter and collect keywords
        for word in words:
            if len(word) > 3 and word not in stop_words:
                keywords.add(word)
        
        # Limit to most relevant keywords (by frequency)
        return sorted(list(keywords))[:20]
    
    @classmethod
    def suggest_applications(cls, verse_data: Dict[str, Any]) -> List[str]:
        """
        Suggest mental health applications based on verse content.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            List of suggested applications
        """
        suggestions = set()
        
        # Get existing applications
        existing = set()
        if 'mental_health_applications' in verse_data:
            apps = verse_data['mental_health_applications']
            if isinstance(apps, dict) and 'applications' in apps:
                existing = set(apps['applications'])
            elif isinstance(apps, list):
                existing = set(apps)
        
        # Combine text for analysis
        text_to_analyze = ' '.join([
            verse_data.get('english', ''),
            verse_data.get('context', ''),
        ]).lower()
        
        # Check for mental health keywords
        for application, keywords in cls.MENTAL_HEALTH_KEYWORDS.items():
            if application not in existing:
                for keyword in keywords:
                    if keyword in text_to_analyze:
                        suggestions.add(application)
                        break
        
        return sorted(list(suggestions))
    
    @classmethod
    def create_searchable_text(cls, verse_data: Dict[str, Any]) -> str:
        """
        Create a combined searchable text from all translations and metadata.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Combined searchable text
        """
        parts = []
        
        # Add all text fields
        fields = ['english', 'hindi', 'context', 'theme']
        for field in fields:
            if field in verse_data and verse_data[field]:
                parts.append(str(verse_data[field]))
        
        # Add applications
        if 'mental_health_applications' in verse_data:
            apps = verse_data['mental_health_applications']
            if isinstance(apps, dict) and 'applications' in apps:
                parts.extend(apps['applications'])
            elif isinstance(apps, list):
                parts.extend(apps)
        
        return ' '.join(parts)
    
    @classmethod
    def add_chapter_context(cls, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add chapter-level context information to the verse.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Verse data with chapter context added
        """
        enriched = verse_data.copy()
        
        # Chapter themes (general themes for each chapter)
        chapter_themes = {
            1: 'facing_challenges',
            2: 'wisdom_and_knowledge',
            3: 'path_of_action',
            4: 'knowledge_and_renunciation',
            5: 'renunciation_of_action',
            6: 'meditation_and_self_control',
            7: 'knowledge_and_wisdom',
            8: 'eternal_reality',
            9: 'royal_knowledge',
            10: 'divine_manifestations',
            11: 'cosmic_vision',
            12: 'path_of_devotion',
            13: 'field_and_knower',
            14: 'three_qualities',
            15: 'supreme_person',
            16: 'divine_and_demonic_natures',
            17: 'three_types_of_faith',
            18: 'liberation_through_renunciation',
        }
        
        chapter = verse_data.get('chapter')
        if chapter and chapter in chapter_themes:
            enriched['chapter_theme'] = chapter_themes[chapter]
        
        return enriched
    
    @classmethod
    def calculate_metadata_score(cls, verse_data: Dict[str, Any]) -> float:
        """
        Calculate a metadata richness score for the verse.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Score from 0.0 to 1.0 indicating metadata richness
        """
        score = 0.0
        max_score = 10.0
        
        # Basic fields (1 point each)
        if verse_data.get('english'):
            score += 1.0
        if verse_data.get('hindi'):
            score += 1.0
        if verse_data.get('sanskrit'):
            score += 1.0
        if verse_data.get('context'):
            score += 1.0
        if verse_data.get('theme'):
            score += 1.0
        
        # Mental health applications (up to 2 points)
        if 'mental_health_applications' in verse_data:
            apps = verse_data['mental_health_applications']
            if isinstance(apps, dict) and 'applications' in apps:
                app_count = len(apps['applications'])
            elif isinstance(apps, list):
                app_count = len(apps)
            else:
                app_count = 0
            
            score += min(app_count * 0.5, 2.0)
        
        # Principles (up to 1 point)
        if verse_data.get('principles'):
            score += min(len(verse_data['principles']) * 0.25, 1.0)
        
        # Keywords (up to 1 point)
        if verse_data.get('keywords'):
            score += min(len(verse_data['keywords']) * 0.1, 1.0)
        
        # Chapter context (1 point)
        if verse_data.get('chapter_theme'):
            score += 1.0
        
        return round(min(score / max_score, 1.0), 2)
