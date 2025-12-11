/**
 * KIAAN Ecosystem API
 * 
 * Unified API layer for all KIAAN-powered tools in the MindVibe ecosystem.
 * Provides constants, helper functions, and utilities for tool integration.
 */

import { KiaanTool, KiaanToolCategory, ToolLink } from '@/types/kiaan-ecosystem.types'

/**
 * Complete registry of KIAAN ecosystem tools
 */
export const KIAAN_TOOLS: KiaanTool[] = [
  {
    id: 'kiaan-chat',
    name: 'KIAAN Chat',
    description: 'AI companion powered by Ancient Wisdom',
    category: 'wisdom',
    endpoint: '/api/chat/message',
    route: '/chat',
    icon: '🕉️',
    usesGitaVerses: true,
    usesValidation: true,
    color: '#8B5CF6',
    enabled: true
  },
  {
    id: 'karma-reset',
    name: 'Karma Reset',
    description: 'Heal relational harm with compassionate guidance',
    category: 'relational',
    endpoint: '/api/karma-reset/kiaan/generate',
    route: '/tools/karma-reset',
    icon: '💚',
    usesGitaVerses: true,
    usesValidation: true,
    color: '#10B981',
    enabled: true
  },
  {
    id: 'emotional-reset',
    name: 'Emotional Reset',
    description: '7-step flow to process emotions and find peace',
    category: 'emotional',
    endpoint: '/api/emotional-reset/generate',
    route: '/tools/emotional-reset',
    icon: '🌊',
    usesGitaVerses: true,
    usesValidation: false,
    color: '#3B82F6',
    enabled: true
  },
  {
    id: 'ardha',
    name: 'Ardha',
    description: 'Reframe negative thoughts with wisdom',
    category: 'reflective',
    endpoint: '/api/ardha/reframe',
    route: '/tools/ardha',
    icon: '🔄',
    usesGitaVerses: true,
    usesValidation: true,
    color: '#F59E0B',
    enabled: true
  },
  {
    id: 'viyoga',
    name: 'Viyoga',
    description: 'Release attachment and find inner peace',
    category: 'emotional',
    endpoint: '/api/viyoga/detach',
    route: '/tools/viyog',
    icon: '🕊️',
    usesGitaVerses: true,
    usesValidation: true,
    color: '#EC4899',
    enabled: true
  },
  {
    id: 'karmic-tree',
    name: 'Karmic Tree',
    description: 'Visualize your growth journey',
    category: 'reflective',
    endpoint: '/api/karmic-tree/growth',
    route: '/tools/karmic-tree',
    icon: '🌳',
    usesGitaVerses: false,
    usesValidation: false,
    color: '#84CC16',
    enabled: true
  }
]

/**
 * Get all KIAAN tools
 */
export function getKiaanTools(): KiaanTool[] {
  return KIAAN_TOOLS.filter(tool => tool.enabled !== false)
}

/**
 * Get a specific tool by ID
 */
export function getToolById(toolId: string): KiaanTool | undefined {
  return KIAAN_TOOLS.find(tool => tool.id === toolId)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: KiaanToolCategory): KiaanTool[] {
  return KIAAN_TOOLS.filter(
    tool => tool.category === category && tool.enabled !== false
  )
}

/**
 * Check if a tool ID is a KIAAN tool
 */
export function isKiaanTool(toolId: string): boolean {
  return KIAAN_TOOLS.some(tool => tool.id === toolId)
}

/**
 * Get related tools (same category, excluding current)
 */
export function getRelatedTools(currentToolId: string): KiaanTool[] {
  const currentTool = getToolById(currentToolId)
  if (!currentTool) return []
  
  return KIAAN_TOOLS.filter(
    tool => 
      tool.category === currentTool.category &&
      tool.id !== currentToolId &&
      tool.enabled !== false
  )
}

/**
 * Get all tools except current
 */
export function getOtherTools(currentToolId: string): KiaanTool[] {
  return KIAAN_TOOLS.filter(
    tool => tool.id !== currentToolId && tool.enabled !== false
  )
}

/**
 * Convert KIAAN tool to navigation link
 */
export function toolToLink(tool: KiaanTool, isActive: boolean = false): ToolLink {
  return {
    name: tool.name,
    path: tool.route,
    icon: tool.icon,
    description: tool.description,
    active: isActive
  }
}

/**
 * Get navigation links for ecosystem tools
 */
export function getEcosystemLinks(
  currentToolId: string,
  relatedOnly: boolean = false
): ToolLink[] {
  const tools = relatedOnly 
    ? getRelatedTools(currentToolId)
    : getOtherTools(currentToolId)
  
  return tools.map(tool => toolToLink(tool, false))
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<KiaanToolCategory, string> = {
  wisdom: 'Wisdom & Guidance',
  emotional: 'Emotional Wellness',
  relational: 'Relationship Healing',
  reflective: 'Self-Reflection'
}

/**
 * Get category display name
 */
export function getCategoryName(category: KiaanToolCategory): string {
  return CATEGORY_NAMES[category] || category
}

/**
 * Get tools that use Gita verses
 */
export function getGitaPoweredTools(): KiaanTool[] {
  return KIAAN_TOOLS.filter(
    tool => tool.usesGitaVerses && tool.enabled !== false
  )
}

/**
 * Get tools that use validation
 */
export function getValidatedTools(): KiaanTool[] {
  return KIAAN_TOOLS.filter(
    tool => tool.usesValidation && tool.enabled !== false
  )
}

/**
 * Tool statistics
 */
export function getEcosystemStats() {
  const enabled = getKiaanTools()
  
  return {
    totalTools: enabled.length,
    gitaPowered: enabled.filter(t => t.usesGitaVerses).length,
    validated: enabled.filter(t => t.usesValidation).length,
    byCategory: {
      wisdom: getToolsByCategory('wisdom').length,
      emotional: getToolsByCategory('emotional').length,
      relational: getToolsByCategory('relational').length,
      reflective: getToolsByCategory('reflective').length
    }
  }
}
