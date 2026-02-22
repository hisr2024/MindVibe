/**
 * KIAAN Ecosystem Types
 * 
 * Type definitions for the KIAAN (Knowledge-Informed Ancient Awareness Navigator)
 * wisdom ecosystem. These types enable integration between different tools while
 * maintaining consistency and type safety.
 */

/**
 * Tool categories in the KIAAN ecosystem
 */
export type KiaanToolCategory = 
  | 'wisdom'          // Core wisdom chat
  | 'emotional'       // Emotional processing tools
  | 'relational'      // Relationship tools
  | 'reflective'      // Self-reflection tools

/**
 * KIAAN tool configuration
 */
export interface KiaanTool {
  /** Unique identifier for the tool */
  id: string
  
  /** Display name */
  name: string
  
  /** Short description */
  description: string
  
  /** Tool category */
  category: KiaanToolCategory
  
  /** API endpoint (relative to base URL) */
  endpoint: string
  
  /** Frontend route path */
  route: string
  
  /** Icon emoji or component name */
  icon: string
  
  /** Whether the tool uses Gita verses */
  usesGitaVerses: boolean
  
  /** Whether the tool validates with GitaValidator */
  usesValidation: boolean
  
  /** Optional color theme for branding */
  color?: string
  
  /** Whether this tool is currently available */
  enabled?: boolean
}

/**
 * KIAAN metadata included in API responses
 */
export interface KiaanMetadata {
  /** Number of Gita verses used in generating response */
  verses_used: number
  
  /** List of verses with basic info */
  verses: Array<{
    verse_id: string
    score: number
    theme: string
    sanitized_text: string
  }>
  
  /** Whether GitaValidator validation passed */
  validation_passed: boolean
  
  /** Validation score (0.0 to 1.0) */
  validation_score: number
  
  /** Gita terms found in the response */
  gita_terms_found: string[]
  
  /** Wisdom context used (truncated) */
  wisdom_context: string
}

/**
 * Standard KIAAN-enhanced API response structure
 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface KiaanResponse<T = any> {
  /** Primary response data */
  data: T
  
  /** KIAAN ecosystem metadata */
  kiaan_metadata?: KiaanMetadata
  
  /** Request metadata */
  _meta?: {
    request_id: string
    processing_time_ms: number
    model_used: string
    kiaan_enhanced: boolean
  }
}

/**
 * Props for KIAAN ecosystem navigation component
 */
export interface EcosystemNavProps {
  /** Current tool ID */
  currentTool: string
  
  /** Optional CSS class name */
  className?: string
  
  /** Whether to show only related tools (same category) */
  relatedOnly?: boolean
}

/**
 * Props for KIAAN badge component
 */
export interface KiaanBadgeProps {
  /** Number of verses used */
  versesUsed: number
  
  /** Whether validation passed */
  validationPassed: boolean
  
  /** Optional validation score to display */
  validationScore?: number
  
  /** Optional CSS class name */
  className?: string
  
  /** Whether to show detailed info on hover */
  showDetails?: boolean
}

/**
 * Verse information for display
 */
export interface VerseInfo {
  /** Verse identifier (e.g., "2.47") */
  verse_id: string
  
  /** Relevance score */
  score: number
  
  /** Theme/category */
  theme: string
  
  /** Sanitized English translation */
  sanitized_text: string
  
  /** Chapter number */
  chapter?: number
  
  /** Verse number within chapter */
  verse?: number
}

/**
 * Tool link configuration for navigation
 */
export interface ToolLink {
  /** Tool display name */
  name: string
  
  /** Route path */
  path: string
  
  /** Icon emoji or component */
  icon: string
  
  /** Brief description */
  description: string
  
  /** Whether currently active */
  active?: boolean
}
