'use client'

import { SUGGESTED_TAGS } from './constants'

interface Props {
  selectedTags: string[]
  onToggle: (tag: string) => void
}

export const TagPicker: React.FC<Props> = ({ selectedTags, onToggle }) => (
  <div
    role="group"
    aria-label="Tags"
    style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
  >
    {SUGGESTED_TAGS.map((tag) => {
      const isSelected = selectedTags.includes(tag)
      return (
        <button
          key={tag}
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          aria-label={tag}
          onClick={() => onToggle(tag)}
          style={{
            padding: '6px 12px',
            minHeight: 32,
            borderRadius: 16,
            background: isSelected ? 'rgba(212,160,23,0.14)' : 'rgba(22,26,66,0.4)',
            border: `1px solid ${
              isSelected ? 'rgba(212,160,23,0.45)' : 'rgba(255,255,255,0.08)'
            }`,
            color: isSelected ? '#F0C040' : '#B8AE98',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 11,
            letterSpacing: '0.03em',
            cursor: 'pointer',
            touchAction: 'manipulation',
            transition: 'all 0.18s ease',
          }}
        >
          #{tag}
        </button>
      )
    })}
  </div>
)
