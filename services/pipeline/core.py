"""
Core Context Transformation Pipeline

Main pipeline orchestrator that combines validation, sanitization, and enrichment
to transform raw Bhagavad Gita verse data into structured, searchable content.
"""

from typing import Dict, List, Optional, Any, Callable
import logging
from .validator import VerseValidator, ValidationError
from .sanitizer import TextSanitizer
from .enricher import MetadataEnricher

# Configure logger
logger = logging.getLogger(__name__)


class PipelineError(Exception):
    """Custom exception for pipeline errors."""
    pass


class ContextTransformationPipeline:
    """
    Main pipeline for transforming Bhagavad Gita verses.
    
    This pipeline processes raw verse data through multiple stages:
    1. Validation - Ensures data completeness and correctness
    2. Normalization - Standardizes format and structure
    3. Sanitization - Removes religious references for universal appeal
    4. Enrichment - Adds metadata, keywords, and search optimization
    
    Example:
        >>> pipeline = ContextTransformationPipeline()
        >>> raw_verse = {
        ...     "chapter": 2,
        ...     "verse_number": 47,
        ...     "english": "You have the right to work only...",
        ...     "theme": "action_without_attachment"
        ... }
        >>> transformed = pipeline.transform(raw_verse)
    """
    
    def __init__(
        self,
        enable_validation: bool = True,
        enable_sanitization: bool = True,
        enable_enrichment: bool = True,
        strict_mode: bool = False
    ):
        """
        Initialize the transformation pipeline.
        
        Args:
            enable_validation: Whether to validate verse data
            enable_sanitization: Whether to sanitize religious references
            enable_enrichment: Whether to enrich with metadata
            strict_mode: If True, raise exceptions on any error
        """
        self.enable_validation = enable_validation
        self.enable_sanitization = enable_sanitization
        self.enable_enrichment = enable_enrichment
        self.strict_mode = strict_mode
        
        # Initialize components
        self.validator = VerseValidator()
        self.sanitizer = TextSanitizer()
        self.enricher = MetadataEnricher()
        
        # Statistics
        self.stats = {
            'processed': 0,
            'validated': 0,
            'sanitized': 0,
            'enriched': 0,
            'errors': 0,
        }
    
    def transform(self, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform a single verse through the complete pipeline.
        
        Args:
            verse_data: Raw verse data dictionary
            
        Returns:
            Transformed verse data
            
        Raises:
            PipelineError: If strict_mode is True and transformation fails
        """
        try:
            result = verse_data.copy()
            
            # Stage 1: Validation and Normalization
            if self.enable_validation:
                result = self.validator.validate_and_normalize(result)
                self.stats['validated'] += 1
            
            # Stage 2: Sanitization
            if self.enable_sanitization:
                result = self.sanitizer.sanitize_verse_data(result)
                
                # Apply text normalizations
                if 'english' in result:
                    result['english'] = self.sanitizer.normalize_whitespace(result['english'])
                    result['english'] = self.sanitizer.standardize_punctuation(result['english'])
                
                if 'context' in result:
                    result['context'] = self.sanitizer.normalize_whitespace(result['context'])
                    result['context'] = self.sanitizer.standardize_punctuation(result['context'])
                
                self.stats['sanitized'] += 1
            
            # Stage 3: Enrichment
            if self.enable_enrichment:
                result = self.enricher.enrich(result)
                result = self.enricher.add_chapter_context(result)
                result['metadata_score'] = self.enricher.calculate_metadata_score(result)
                self.stats['enriched'] += 1
            
            self.stats['processed'] += 1
            return result
            
        except ValidationError as e:
            self.stats['errors'] += 1
            if self.strict_mode:
                raise PipelineError(f"Validation failed: {str(e)}") from e
            return verse_data  # Return original data if not in strict mode
            
        except Exception as e:
            self.stats['errors'] += 1
            if self.strict_mode:
                raise PipelineError(f"Pipeline transformation failed: {str(e)}") from e
            return verse_data  # Return original data if not in strict mode
    
    def transform_batch(
        self,
        verses: List[Dict[str, Any]],
        continue_on_error: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Transform multiple verses in batch.
        
        Args:
            verses: List of raw verse data dictionaries
            continue_on_error: If True, continue processing on errors
            
        Returns:
            List of transformed verses
        """
        results = []
        
        for i, verse in enumerate(verses):
            try:
                transformed = self.transform(verse)
                results.append(transformed)
            except PipelineError as e:
                if not continue_on_error:
                    raise
                # Log error and skip this verse
                logger.warning(f"Failed to transform verse {i}: {str(e)}")
                self.stats['errors'] += 1
        
        return results
    
    def validate_only(self, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run only the validation stage.
        
        Args:
            verse_data: Raw verse data dictionary
            
        Returns:
            Validation report
        """
        errors = self.validator.check_errors(verse_data)
        completeness = self.validator.check_completeness(verse_data)
        
        return {
            'is_valid': len(errors) == 0,
            'errors': errors,
            'completeness': completeness,
        }
    
    def get_statistics(self) -> Dict[str, int]:
        """
        Get pipeline processing statistics.
        
        Returns:
            Dictionary with processing statistics
        """
        return self.stats.copy()
    
    def reset_statistics(self) -> None:
        """Reset pipeline statistics."""
        for key in self.stats:
            self.stats[key] = 0
    
    @staticmethod
    def create_minimal_pipeline() -> 'ContextTransformationPipeline':
        """
        Create a minimal pipeline with only validation enabled.
        
        Returns:
            Pipeline instance with minimal configuration
        """
        return ContextTransformationPipeline(
            enable_validation=True,
            enable_sanitization=False,
            enable_enrichment=False,
            strict_mode=False
        )
    
    @staticmethod
    def create_full_pipeline(strict: bool = False) -> 'ContextTransformationPipeline':
        """
        Create a full pipeline with all features enabled.
        
        Args:
            strict: Whether to enable strict mode
            
        Returns:
            Pipeline instance with full configuration
        """
        return ContextTransformationPipeline(
            enable_validation=True,
            enable_sanitization=True,
            enable_enrichment=True,
            strict_mode=strict
        )
    
    def add_custom_stage(
        self,
        stage_name: str,
        transform_func: Callable[[Dict[str, Any]], Dict[str, Any]]
    ) -> None:
        """
        Add a custom transformation stage to the pipeline.
        
        Args:
            stage_name: Name of the custom stage
            transform_func: Function that takes and returns verse data
        """
        # Store custom stage for future use
        if not hasattr(self, '_custom_stages'):
            self._custom_stages = []
        
        self._custom_stages.append({
            'name': stage_name,
            'func': transform_func
        })
    
    def transform_with_custom_stages(self, verse_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform verse data through standard and custom stages.
        
        Args:
            verse_data: Raw verse data dictionary
            
        Returns:
            Transformed verse data
        """
        # Run standard transformation
        result = self.transform(verse_data)
        
        # Run custom stages if any
        if hasattr(self, '_custom_stages'):
            for stage in self._custom_stages:
                try:
                    result = stage['func'](result)
                except Exception as e:
                    if self.strict_mode:
                        raise PipelineError(
                            f"Custom stage '{stage['name']}' failed: {str(e)}"
                        ) from e
                    logger.warning(f"Custom stage '{stage['name']}' failed: {str(e)}")
        
        return result
    
    def export_configuration(self) -> Dict[str, Any]:
        """
        Export current pipeline configuration.
        
        Returns:
            Dictionary with pipeline configuration
        """
        return {
            'enable_validation': self.enable_validation,
            'enable_sanitization': self.enable_sanitization,
            'enable_enrichment': self.enable_enrichment,
            'strict_mode': self.strict_mode,
            'custom_stages': len(getattr(self, '_custom_stages', [])),
        }
