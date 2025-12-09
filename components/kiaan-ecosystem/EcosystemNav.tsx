/**
 * KIAAN Ecosystem Navigation Component
 * 
 * Displays related KIAAN tools in a sidebar or navigation area.
 * Helps users discover other tools in the ecosystem.
 */

'use client'

import Link from 'next/link'
import { EcosystemNavProps } from '@/types/kiaan-ecosystem.types'
import { getEcosystemLinks, getToolById, getCategoryName } from '@/lib/api/kiaan-ecosystem'

export default function EcosystemNav({
  currentTool,
  className = '',
  relatedOnly = false
}: EcosystemNavProps) {
  const currentToolInfo = getToolById(currentTool)
  const links = getEcosystemLinks(currentTool, relatedOnly)
  
  if (links.length === 0) {
    return null
  }
  
  const categoryName = currentToolInfo 
    ? getCategoryName(currentToolInfo.category)
    : 'KIAAN Ecosystem'
  
  return (
    <nav className={`kiaan-ecosystem-nav ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {relatedOnly ? `More ${categoryName}` : 'Explore KIAAN Tools'}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Wisdom-powered tools for your journey
        </p>
      </div>
      
      {/* Tool links */}
      <ul className="space-y-2">
        {links.map(link => (
          <li key={link.path}>
            <Link
              href={link.path}
              className="group flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
            >
              {/* Icon */}
              <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                {link.icon}
              </span>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {link.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {link.description}
                </div>
              </div>
              
              {/* Arrow */}
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="text-purple-600 dark:text-purple-400">🕉️</span>
          <span>Powered by KIAAN Wisdom Engine</span>
        </div>
      </div>
    </nav>
  )
}
