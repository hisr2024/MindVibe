'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Verse {
  chapter: number
  verse: number
  english: string
  sanskrit: string
  theme: string
  principle: string
}

interface SacredReflection {
  week_start_date: string
  week_end_date: string
  emotional_journey_summary: string
  key_insights: string[]
  verses_explored: Verse[]
  milestones_achieved: string[]
  areas_for_growth: string[]
  gratitude_items: string[]
  overall_wellbeing_score: number | null
}

export default function SacredReflectionsPage() {
  const [reflection, setReflection] = useState<SacredReflection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReflection = async () => {
      try {
        const response = await fetch('/api/kiaan/sacred-reflections/current-week', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setReflection(data)
        } else {
          setError('Failed to load reflection')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchReflection()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !reflection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">{error || 'No reflection available'}</p>
            <Link href="/kiaan" className="text-purple-600 hover:text-purple-700">
              ← Back to KIAAN
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/kiaan" className="text-purple-600 hover:text-purple-700 mb-4 inline-block">
            ← Back to KIAAN
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Sacred Reflections</h1>
          <p className="text-gray-600 mt-2">
            Week of {new Date(reflection.week_start_date).toLocaleDateString()} - {new Date(reflection.week_end_date).toLocaleDateString()}
          </p>
        </div>

        {reflection.overall_wellbeing_score !== null && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Overall Wellbeing</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${reflection.overall_wellbeing_score * 10}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {reflection.overall_wellbeing_score}/10
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Emotional Journey</h2>
          <p className="text-gray-700">{reflection.emotional_journey_summary}</p>
        </div>

        {reflection.key_insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Key Insights</h2>
            <ul className="space-y-2">
              {reflection.key_insights.map((insight, i) => (
                <li key={i} className="flex gap-2">
                  <span>✨</span>
                  <p className="text-gray-700">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reflection.verses_explored.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Verses Explored</h2>
            <div className="space-y-4">
              {reflection.verses_explored.map((verse, i) => (
                <div key={i} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <div className="text-xs font-semibold text-purple-600 mb-2">
                    Chapter {verse.chapter}, Verse {verse.verse}
                  </div>
                  <p className="text-gray-800 mb-2">{verse.english}</p>
                  <p className="text-sm text-gray-600 italic">{verse.principle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reflection.milestones_achieved.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Milestones Achieved</h2>
            <ul className="space-y-2">
              {reflection.milestones_achieved.map((milestone, i) => (
                <li key={i} className="flex gap-2">
                  <span>🏆</span>
                  <p className="text-gray-700">{milestone}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reflection.areas_for_growth.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Areas for Growth</h2>
            <ul className="space-y-2">
              {reflection.areas_for_growth.map((area, i) => (
                <li key={i} className="flex gap-2">
                  <span>🌱</span>
                  <p className="text-gray-700">{area}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reflection.gratitude_items.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Gratitude</h2>
            <ul className="space-y-2">
              {reflection.gratitude_items.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span>🙏</span>
                  <p className="text-gray-700">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
