"""
Text Sanitizer Module

Sanitizes religious terminology and standardizes language for universal appeal.
Replaces person-specific references with general terms suitable for all audiences.
"""

import re
from typing import Dict, Optional, List


class TextSanitizer:
    """
    Sanitizes text by replacing religious terminology with universal language.
    
    This class provides methods to transform religious texts into universally
    applicable wisdom by replacing specific religious references with neutral terms.
    """
    
    # Religious terms to replace (case-insensitive patterns)
    RELIGIOUS_REPLACEMENTS: Dict[str, str] = {
        # Person references
        r'\bkrishna\b': 'the teacher',
        r'\barjuna\b': 'the student',
        r'\bdhritarashtra\b': 'the elder',
        r'\bsanjaya\b': 'the observer',
        r'\bpandava[s]?\b': 'the seekers',
        r'\bkaurava[s]?\b': 'the opposition',
        
        # Deity references
        r'\blord\b': 'the wise one',
        r'\bgod\b': 'inner wisdom',
        r'\bbhagavan\b': 'the enlightened one',
        r'\bavatar\b': 'the teacher',
        r'\bdeity\b': 'higher consciousness',
        r'\bdivine\b': 'universal',
        r'\bholy\b': 'sacred',
        
        # Religious concepts (contextual)
        r'\bsoul\b': 'true self',
        r'\batman\b': 'inner essence',
        r'\bbrahman\b': 'ultimate reality',
        
        # Location references
        r'\bkurukshetra\b': 'the battlefield',
        r'\bvrindavan\b': 'the sacred place',
        
        # Religious tradition references
        r'\bhindu\b': 'ancient',
        r'\bhinduism\b': 'ancient wisdom',
        r'\bvedic\b': 'ancient',
        r'\bsanskrit\b': 'classical',
    }
    
    # Terms to preserve (don't sanitize these universal concepts)
    PRESERVE_TERMS: List[str] = [
        'dharma',  # Often used in universal context
        'karma',   # Widely understood concept
        'yoga',    # Universal practice term
        'meditation',
        'mindfulness',
        'wisdom',
        'peace',
        'truth',
    ]
    
    @classmethod
    def sanitize(cls, text: str, preserve_sanskrit: bool = False) -> str:
        """
        Sanitize text by replacing religious references with universal terms.
        
        Args:
            text: The text to sanitize
            preserve_sanskrit: If True, preserve original Sanskrit terms
            
        Returns:
            Sanitized text with religious references replaced
        """
        if not text:
            return text
        
        sanitized = text
        
        # Apply replacements
        for pattern, replacement in cls.RELIGIOUS_REPLACEMENTS.items():
            # Skip if we're preserving Sanskrit and this is a Sanskrit term
            if preserve_sanskrit and any(term in pattern for term in ['sanskrit', 'dharma', 'karma', 'yoga']):
                continue
                
            # Replace with case preservation
            sanitized = re.sub(
                pattern, 
                replacement, 
                sanitized, 
                flags=re.IGNORECASE
            )
        
        return sanitized
    
    @classmethod
    def sanitize_verse_data(cls, verse_data: Dict) -> Dict:
        """
        Sanitize all text fields in a verse data dictionary.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Dictionary with sanitized text fields
        """
        sanitized_data = verse_data.copy()
        
        # Sanitize specific fields (preserve Sanskrit text as-is)
        text_fields = ['english', 'hindi', 'context', 'modern_context']
        
        for field in text_fields:
            if field in sanitized_data and sanitized_data[field]:
                sanitized_data[field] = cls.sanitize(sanitized_data[field])
        
        # Theme sanitization (replace underscores, title case)
        if 'theme' in sanitized_data:
            sanitized_data['theme'] = sanitized_data['theme'].replace('_', ' ').title()
        
        return sanitized_data
    
    @classmethod
    def normalize_whitespace(cls, text: str) -> str:
        """
        Normalize whitespace in text (remove extra spaces, normalize line breaks).
        
        Args:
            text: The text to normalize
            
        Returns:
            Text with normalized whitespace
        """
        if not text:
            return text
        
        # Replace multiple spaces with single space
        normalized = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        normalized = normalized.strip()
        
        return normalized
    
    @classmethod
    def remove_pronunciation_guides(cls, text: str) -> str:
        """
        Remove pronunciation guides and diacritical marks from transliterated text.
        
        Args:
            text: Text that may contain pronunciation guides
            
        Returns:
            Text with pronunciation guides removed
        """
        # Remove common pronunciation guide patterns
        # E.g., [pronunciation], (pronunciation), /pronunciation/
        cleaned = re.sub(r'\[.*?\]', '', text)
        cleaned = re.sub(r'\(.*?\)', '', cleaned)
        cleaned = re.sub(r'/.*?/', '', cleaned)
        
        return cls.normalize_whitespace(cleaned)
    
    @classmethod
    def standardize_punctuation(cls, text: str) -> str:
        """
        Standardize punctuation in text for consistency.
        
        Args:
            text: The text to standardize
            
        Returns:
            Text with standardized punctuation
        """
        if not text:
            return text
        
        standardized = text
        
        # Ensure sentences end with proper punctuation
        if standardized and standardized[-1] not in '.!?':
            standardized += '.'
        
        # Standardize quotes
        standardized = standardized.replace('"', '"').replace('"', '"')
        standardized = standardized.replace(''', "'").replace(''', "'")
        
        # Ensure space after punctuation
        standardized = re.sub(r'([.!?,;:])([A-Za-z])', r'\1 \2', standardized)
        
        return standardized
