'use client'

/**
 * Affirmations Widget Component
 *
 * UI for voice-delivered positive affirmations:
 * - Category selection
 * - Affirmation display with Hindi translation
 * - Voice playback controls
 * - Favorites & custom affirmations
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Play,
  Pause,
  SkipForward,
  Heart,
  RefreshCw,
  Star,
  Sun,
  Moon,
  Shield,
  Leaf,
  BookOpen
} from 'lucide-react'

// ============ Types ============

export type AffirmationCategory =
  | 'confidence' | 'calm' | 'gratitude' | 'self_love' | 'strength'
  | 'healing' | 'abundance' | 'peace' | 'wisdom' | 'morning' | 'evening' | 'gita_inspired'

export interface Affirmation {
  id: string
  text: string
  textHindi?: string
  category: AffirmationCategory
}

export interface AffirmationsWidgetProps {
  onPlay?: (affirmation: Affirmation) => void
  onFavorite?: (affirmation: Affirmation) => void
  favorites?: string[]
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const CATEGORIES: Record<AffirmationCategory, {
  name: string
  nameHindi: string
  icon: typeof Sparkles
  color: string
}> = {
  confidence: { name: 'Confidence', nameHindi: 'आत्मविश्वास', icon: Star, color: 'text-yellow-400' },
  calm: { name: 'Calm', nameHindi: 'शांति', icon: Leaf, color: 'text-emerald-400' },
  gratitude: { name: 'Gratitude', nameHindi: 'कृतज्ञता', icon: Heart, color: 'text-pink-400' },
  self_love: { name: 'Self Love', nameHindi: 'आत्म-प्रेम', icon: Heart, color: 'text-rose-400' },
  strength: { name: 'Strength', nameHindi: 'शक्ति', icon: Shield, color: 'text-orange-400' },
  healing: { name: 'Healing', nameHindi: 'उपचार', icon: Sparkles, color: 'text-teal-400' },
  abundance: { name: 'Abundance', nameHindi: 'प्रचुरता', icon: Star, color: 'text-amber-400' },
  peace: { name: 'Peace', nameHindi: 'शांति', icon: Leaf, color: 'text-blue-400' },
  wisdom: { name: 'Wisdom', nameHindi: 'ज्ञान', icon: BookOpen, color: 'text-purple-400' },
  morning: { name: 'Morning', nameHindi: 'सुबह', icon: Sun, color: 'text-amber-400' },
  evening: { name: 'Evening', nameHindi: 'शाम', icon: Moon, color: 'text-indigo-400' },
  gita_inspired: { name: 'Gita Wisdom', nameHindi: 'गीता', icon: BookOpen, color: 'text-orange-400' }
}

// Sample affirmations (subset - full list in engine)
const SAMPLE_AFFIRMATIONS: Affirmation[] = [
  { id: 'conf_1', text: 'I am capable of achieving great things.', textHindi: 'मैं महान चीजें हासिल करने में सक्षम हूं।', category: 'confidence' },
  { id: 'conf_2', text: 'I trust in my abilities and decisions.', textHindi: 'मुझे अपनी क्षमताओं और निर्णयों पर भरोसा है।', category: 'confidence' },
  { id: 'calm_1', text: 'I am at peace with this moment.', textHindi: 'मैं इस पल के साथ शांति में हूं।', category: 'calm' },
  { id: 'calm_2', text: 'I release all tension from my body and mind.', textHindi: 'मैं अपने शरीर और मन से सारा तनाव छोड़ देता हूं।', category: 'calm' },
  { id: 'grat_1', text: 'I am grateful for all the blessings in my life.', textHindi: 'मैं अपने जीवन के सभी आशीर्वादों के लिए आभारी हूं।', category: 'gratitude' },
  { id: 'love_1', text: 'I love and accept myself exactly as I am.', textHindi: 'मैं खुद को जैसा हूं वैसा ही प्यार और स्वीकार करता हूं।', category: 'self_love' },
  { id: 'str_1', text: 'I have the strength to overcome any challenge.', textHindi: 'मुझमें किसी भी चुनौती को पार करने की शक्ति है।', category: 'strength' },
  { id: 'heal_1', text: 'My body is healing and growing stronger every day.', textHindi: 'मेरा शरीर हर दिन ठीक हो रहा है और मजबूत हो रहा है।', category: 'healing' },
  { id: 'peace_1', text: 'I choose peace over worry.', textHindi: 'मैं चिंता से ऊपर शांति चुनता हूं।', category: 'peace' },
  { id: 'gita_1', text: 'I perform my duties without attachment to results.', textHindi: 'मैं परिणामों की आसक्ति के बिना अपने कर्तव्यों का पालन करता हूं।', category: 'gita_inspired' },
  { id: 'gita_2', text: 'I am the eternal Self, beyond birth and death.', textHindi: 'मैं शाश्वत आत्मा हूं, जन्म और मृत्यु से परे।', category: 'gita_inspired' },
  { id: 'morn_1', text: 'Today is a new beginning full of possibilities.', textHindi: 'आज संभावनाओं से भरी एक नई शुरुआत है।', category: 'morning' },
  { id: 'eve_1', text: 'I release the day and welcome peaceful rest.', textHindi: 'मैं दिन को छोड़ता हूं और शांतिपूर्ण विश्राम का स्वागत करता हूं।', category: 'evening' },
  { id: 'wis_1', text: 'I trust the wisdom within me to guide my path.', textHindi: 'मुझे अपने भीतर के ज्ञान पर भरोसा है जो मेरा मार्गदर्शन करता है।', category: 'wisdom' }
]

// ============ Component ============

export function AffirmationsWidget({
  onPlay,
  onFavorite,
  favorites = [],
  compact = false,
  className = ''
}: AffirmationsWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<AffirmationCategory>('confidence')
  const [currentAffirmation, setCurrentAffirmation] = useState<Affirmation | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHindi, setShowHindi] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)

  // Get affirmations for selected category
  const categoryAffirmations = SAMPLE_AFFIRMATIONS.filter(a => a.category === selectedCategory)

  // Set initial affirmation
  useEffect(() => {
    if (categoryAffirmations.length > 0 && !currentAffirmation) {
      setCurrentAffirmation(categoryAffirmations[0])
    }
  }, [categoryAffirmations, currentAffirmation])

  const handleNext = useCallback(() => {
    const currentIndex = categoryAffirmations.findIndex(a => a.id === currentAffirmation?.id)
    const nextIndex = (currentIndex + 1) % categoryAffirmations.length
    setCurrentAffirmation(categoryAffirmations[nextIndex])
  }, [categoryAffirmations, currentAffirmation])

  const handleRandom = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * categoryAffirmations.length)
    setCurrentAffirmation(categoryAffirmations[randomIndex])
  }, [categoryAffirmations])

  const handlePlay = useCallback(() => {
    if (currentAffirmation) {
      setIsPlaying(!isPlaying)
      if (!isPlaying) {
        onPlay?.(currentAffirmation)
      }
    }
  }, [currentAffirmation, isPlaying, onPlay])

  const handleFavorite = useCallback(() => {
    if (currentAffirmation) {
      onFavorite?.(currentAffirmation)
    }
  }, [currentAffirmation, onFavorite])

  const handleCategoryChange = useCallback((category: AffirmationCategory) => {
    setSelectedCategory(category)
    const categoryAffs = SAMPLE_AFFIRMATIONS.filter(a => a.category === category)
    if (categoryAffs.length > 0) {
      setCurrentAffirmation(categoryAffs[0])
    }
  }, [])

  const categoryConfig = CATEGORIES[selectedCategory]
  const CategoryIcon = categoryConfig.icon
  const isFavorited = currentAffirmation ? favorites.includes(currentAffirmation.id) : false

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-purple-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">Affirmations</p>
              <p className="text-[10px] text-white/50">{categoryConfig.name}</p>
            </div>
          </div>
          <button
            onClick={handlePlay}
            className={`p-2 rounded-lg transition-all ${
              isPlaying
                ? 'bg-purple-500/30 text-purple-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
        {currentAffirmation && (
          <p className="text-xs text-white/70 line-clamp-2">{currentAffirmation.text}</p>
        )}
      </div>
    )
  }

  // Full view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Affirmations</h3>
              <p className="text-xs text-white/50">Positive Voice Guidance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHindi(!showHindi)}
              className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                showHindi ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/40'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>

      {/* Category Selection */}
      <div className="p-4 border-b border-white/5">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {(Object.keys(CATEGORIES) as AffirmationCategory[]).slice(0, 6).map((cat) => {
            const config = CATEGORIES[cat]
            const Icon = config.icon
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-purple-500/50 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? config.color : 'text-white/40'}`} />
                <p className={`text-xs whitespace-nowrap ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {config.name}
                </p>
              </button>
            )
          })}
        </div>

        {/* More categories */}
        <details className="mt-2">
          <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
            More categories...
          </summary>
          <div className="flex gap-2 flex-wrap mt-2">
            {(Object.keys(CATEGORIES) as AffirmationCategory[]).slice(6).map((cat) => {
              const config = CATEGORIES[cat]
              const isSelected = selectedCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {config.name}
                </button>
              )
            })}
          </div>
        </details>
      </div>

      {/* Current Affirmation Display */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {currentAffirmation && (
            <motion.div
              key={currentAffirmation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center"
            >
              {/* Affirmation Text */}
              <p className="text-lg font-medium text-white leading-relaxed mb-3">
                &ldquo;{currentAffirmation.text}&rdquo;
              </p>

              {/* Hindi Translation */}
              {showHindi && currentAffirmation.textHindi && (
                <p className="text-sm text-white/50 mb-4">
                  {currentAffirmation.textHindi}
                </p>
              )}

              {/* Category Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5">
                <CategoryIcon className={`w-3 h-3 ${categoryConfig.color}`} />
                <span className="text-xs text-white/50">{categoryConfig.name}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-3">
          {/* Random */}
          <button
            onClick={handleRandom}
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
            title="Random"
            aria-label="Random affirmation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlay}
            className={`p-4 rounded-2xl transition-all ${
              isPlaying
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
            aria-label={isPlaying ? 'Pause affirmation' : 'Play affirmation'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>

          {/* Next */}
          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 transition-colors"
            title="Next"
            aria-label="Next affirmation"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Favorite */}
          <button
            onClick={handleFavorite}
            className={`p-2.5 rounded-xl transition-colors ${
              isFavorited
                ? 'bg-pink-500/20 text-pink-400'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
            title="Favorite"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Auto-play Toggle */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-white/50">Auto-play next</span>
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              autoPlay ? 'bg-purple-500' : 'bg-white/20'
            }`}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: autoPlay ? 20 : 4 }}
            />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default AffirmationsWidget
