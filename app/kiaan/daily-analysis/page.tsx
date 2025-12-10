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

interface DailyAnalysis {
  analysis_date: string
  emotional_summary: string
  recommended_verses: Verse[]
  insights: string[]
  action_items: string[]
  overall_mood_score: number | null
}

export default function DailyAnalysisPage() {
  const [analysis, setAnalysis] = useState<DailyAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch('/api/kiaan/daily-analysis/today', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setAnalysis(data)
        } else {
          setError('Failed to load analysis')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">{error || 'No analysis available'}</p>
            <Link href="/kiaan" className="text-indigo-600 hover:text-indigo-700">
              ← Back to KIAAN
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link href="/kiaan" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Back to KIAAN
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Daily Analysis</h1>
          <p className="text-gray-600 mt-2">
            {new Date(analysis.analysis_date).toLocaleDateString()}
          </p>
        </div>

        {analysis.overall_mood_score !== null && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Overall Wellbeing</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${analysis.overall_mood_score * 10}%` }}
                ></div>
              </div>
              <span className="text-2xl font-bold text-indigo-600">
                {analysis.overall_mood_score}/10
              </span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-3">Emotional Summary</h2>
          <p className="text-gray-700">{analysis.emotional_summary}</p>
        </div>

        {analysis.insights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Key Insights</h2>
            <ul className="space-y-2">
              {analysis.insights.map((insight, i) => (
                <li key={i} className="flex gap-2">
                  <span>💡</span>
                  <p className="text-gray-700">{insight}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.recommended_verses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Wisdom for Today</h2>
            <div className="space-y-4">
              {analysis.recommended_verses.map((verse, i) => (
                <div key={i} className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
                  <div className="text-xs font-semibold text-indigo-600 mb-2">
                    Chapter {verse.chapter}, Verse {verse.verse}
                  </div>
                  <p className="text-gray-800 mb-2">{verse.english}</p>
                  <p className="text-sm text-gray-600 italic">{verse.principle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis.action_items.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Actions for Today</h2>
            <ul className="space-y-2">
              {analysis.action_items.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <input type="checkbox" className="mt-1 w-5 h-5 text-indigo-600 rounded" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
