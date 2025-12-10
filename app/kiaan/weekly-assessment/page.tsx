'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Question {
  id: string
  question: string
  type: string
  scale?: { min: number; max: number; labels: string[] }
  options?: string[]
}

interface AssessmentQuestions {
  questions: Question[]
}

export default function WeeklyAssessmentPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/kiaan/weekly-assessment/questions')
        if (response.ok) {
          const data: AssessmentQuestions = await response.json()
          setQuestions(data.questions)
        } else {
          setError('Failed to load questions')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleScaleChange = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  const handleMultiselectChange = (questionId: string, option: string, checked: boolean) => {
    setResponses(prev => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, option] }
      } else {
        return { ...prev, [questionId]: current.filter((o: string) => o !== option) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/kiaan/weekly-assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ responses }),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        setError('Failed to submit assessment')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for completing your weekly assessment. Your personalized insights are ready.
            </p>
            <Link
              href="/kiaan"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Return to KIAAN
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/kiaan" className="text-indigo-600 hover:text-indigo-700 mb-4 inline-block">
            ← Back to KIAAN
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Weekly Assessment</h1>
          <p className="text-gray-600 mt-2">
            Take a few moments to reflect on your week
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {question.question}
              </h3>

              {question.type === 'scale' && question.scale && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 min-w-[100px]">
                      {question.scale.labels[0]}
                    </span>
                    <input
                      type="range"
                      min={question.scale.min}
                      max={question.scale.max}
                      value={responses[question.id] || question.scale.min}
                      onChange={(e) => handleScaleChange(question.id, parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[100px] text-right">
                      {question.scale.labels[1]}
                    </span>
                  </div>
                  <div className="text-center text-2xl font-bold text-indigo-600">
                    {responses[question.id] || question.scale.min}
                  </div>
                </div>
              )}

              {question.type === 'multiselect' && question.options && (
                <div className="grid grid-cols-2 gap-3">
                  {question.options.map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(responses[question.id] || []).includes(option)}
                        onChange={(e) => handleMultiselectChange(question.id, option, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || Object.keys(responses).length === 0}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Complete Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
