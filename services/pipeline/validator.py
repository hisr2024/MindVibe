"""
Verse Validator Module

Validates verse data structure and content for consistency and completeness.
Ensures all required fields are present and properly formatted.
"""

from typing import Dict, List, Optional, Any
import re


class ValidationError(Exception):
    """Custom exception for validation errors."""
    pass


class VerseValidator:
    """
    Validates verse data for completeness and correctness.
    
    Ensures that verse data has all required fields with proper formatting
    before being processed through the transformation pipeline.
    """
    
    # Required fields for a complete verse
    REQUIRED_FIELDS = [
        'chapter',
        'verse_number',
        'theme',
        'english',
    ]
    
    # Optional but recommended fields
    RECOMMENDED_FIELDS = [
        'hindi',
        'sanskrit',
        'context',
        'mental_health_applications',
    ]
    
    # Valid mental health application categories
    VALID_APPLICATIONS = {
        'anxiety_management',
        'stress_reduction',
        'depression_recovery',
        'anger_management',
        'emotional_regulation',
        'resilience',
        'mindfulness',
        'equanimity',
        'self_empowerment',
        'self_compassion',
        'personal_growth',
        'letting_go',
        'present_moment_focus',
        'addiction_recovery',
        'impulse_control',
        'cognitive_awareness',
        'fear',
        'grief',
        'acceptance',
        'self_control',
        'confusion',
        'courage',
    }
    
    @classmethod
    def validate(cls, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate verse data and return validated data or raise ValidationError.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Validated verse data
            
        Raises:
            ValidationError: If validation fails
        """
        errors = cls.check_errors(verse_data)
        
        if errors:
            raise ValidationError(
                f"Validation failed with {len(errors)} error(s): " + 
                "; ".join(errors)
            )
        
        return verse_data
    
    @classmethod
    def check_errors(cls, verse_data: Dict[str, Any]) -> List[str]:
        """
        Check for validation errors without raising exceptions.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            List of error messages (empty if valid)
        """
        errors = []
        
        # Check required fields
        for field in cls.REQUIRED_FIELDS:
            if field not in verse_data:
                errors.append(f"Missing required field: {field}")
            elif not verse_data[field]:
                errors.append(f"Required field is empty: {field}")
        
        # Validate chapter number
        if 'chapter' in verse_data:
            if not isinstance(verse_data['chapter'], int):
                errors.append("Chapter must be an integer")
            elif verse_data['chapter'] < 1 or verse_data['chapter'] > 18:
                errors.append(f"Chapter must be between 1 and 18, got {verse_data['chapter']}")
        
        # Validate verse number
        if 'verse_number' in verse_data:
            if not isinstance(verse_data['verse_number'], int):
                errors.append("Verse number must be an integer")
            elif verse_data['verse_number'] < 1:
                errors.append("Verse number must be positive")
        
        # Validate theme format
        if 'theme' in verse_data and verse_data['theme']:
            theme = verse_data['theme']
            if not isinstance(theme, str):
                errors.append("Theme must be a string")
            else:
                # Normalize theme for validation (convert spaces to underscores)
                normalized_theme = theme.lower().replace(' ', '_')
                if not re.match(r'^[a-z_]+$', normalized_theme):
                    errors.append(
                        f"Theme should contain only letters and underscores. Got: '{theme}' "
                        f"(normalized: '{normalized_theme}')"
                    )
        
        # Validate text fields are strings
        text_fields = ['english', 'hindi', 'sanskrit', 'context']
        for field in text_fields:
            if field in verse_data and verse_data[field] is not None:
                if not isinstance(verse_data[field], str):
                    errors.append(f"{field} must be a string")
        
        # Validate mental health applications
        if 'mental_health_applications' in verse_data:
            apps = verse_data['mental_health_applications']
            
            if isinstance(apps, dict):
                # New format: {"applications": ["app1", "app2"]}
                if 'applications' in apps:
                    if not isinstance(apps['applications'], list):
                        errors.append("mental_health_applications.applications must be a list")
                    else:
                        cls._validate_application_list(apps['applications'], errors)
            elif isinstance(apps, list):
                # Old format: ["app1", "app2"]
                cls._validate_application_list(apps, errors)
            else:
                errors.append(
                    "mental_health_applications must be a list or dict with 'applications' key"
                )
        
        return errors
    
    @classmethod
    def _validate_application_list(cls, apps: List[str], errors: List[str]) -> None:
        """
        Validate a list of mental health applications.
        
        Args:
            apps: List of application strings
            errors: List to append errors to
        """
        for app in apps:
            if not isinstance(app, str):
                errors.append(f"Application must be a string: {app}")
            # Note: We warn but don't error on unknown applications to allow extensibility
    
    @classmethod
    def check_completeness(cls, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check completeness of verse data and return report.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Dictionary with completeness metrics
        """
        total_fields = len(cls.REQUIRED_FIELDS) + len(cls.RECOMMENDED_FIELDS)
        present_fields = 0
        missing_recommended = []
        
        # Count required fields
        for field in cls.REQUIRED_FIELDS:
            if field in verse_data and verse_data[field]:
                present_fields += 1
        
        # Count recommended fields
        for field in cls.RECOMMENDED_FIELDS:
            if field in verse_data and verse_data[field]:
                present_fields += 1
            else:
                missing_recommended.append(field)
        
        completeness_score = (present_fields / total_fields) * 100
        
        return {
            'completeness_score': round(completeness_score, 2),
            'total_fields': total_fields,
            'present_fields': present_fields,
            'missing_recommended': missing_recommended,
            'is_complete': completeness_score >= 80,  # 80% threshold
        }
    
    @classmethod
    def normalize_verse_id(cls, chapter: int, verse_number: int) -> str:
        """
        Create a standardized verse ID from chapter and verse number.
        
        Args:
            chapter: Chapter number
            verse_number: Verse number
            
        Returns:
            Standardized verse ID (e.g., "2.47")
        """
        return f"{chapter}.{verse_number}"
    
    @classmethod
    def validate_and_normalize(cls, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and normalize verse data in one step.
        
        Args:
            verse_data: Dictionary containing verse information
            
        Returns:
            Validated and normalized verse data
            
        Raises:
            ValidationError: If validation fails
        """
        # First validate
        validated = cls.validate(verse_data)
        
        # Add verse_id if not present
        if 'verse_id' not in validated:
            validated['verse_id'] = cls.normalize_verse_id(
                validated['chapter'],
                validated['verse_number']
            )
        
        # Normalize mental_health_applications format
        if 'mental_health_applications' in validated:
            apps = validated['mental_health_applications']
            if isinstance(apps, list):
                # Convert old format to new format
                validated['mental_health_applications'] = {
                    'applications': apps
                }
        
        # Ensure theme is in snake_case
        if 'theme' in validated:
            validated['theme'] = validated['theme'].lower().replace(' ', '_')
        
        return validated
