'use client'

interface PreferencesStepProps {
  selectedGoals: string[]
  onGoalsChange: (goals: string[]) => void
}

const goals = [
  { id: 'stress', label: 'Manage stress', icon: '🧘' },
  { id: 'sleep', label: 'Better sleep', icon: '😴' },
  { id: 'focus', label: 'Improve focus', icon: '🎯' },
  { id: 'anxiety', label: 'Reduce anxiety', icon: '🌿' },
  { id: 'mood', label: 'Track mood', icon: '📊' },
  { id: 'growth', label: 'Personal growth', icon: '🌱' },
  { id: 'relationships', label: 'Better relationships', icon: '💝' },
  { id: 'mindfulness', label: 'Practice mindfulness', icon: '🧠' },
]

export function PreferencesStep({
  selectedGoals,
  onGoalsChange,
}: PreferencesStepProps) {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((id) => id !== goalId))
    } else {
      onGoalsChange([...selectedGoals, goalId])
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <p className="text-sm text-[#f5f0e8]/70 text-center mb-4">
        Select all that apply. You can change these later.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id)
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                isSelected
                  ? 'border-[#d4a44c] bg-[#d4a44c]/10'
                  : 'border-[#d4a44c]/20 bg-black/30 hover:border-[#d4a44c]/50'
              }`}
            >
              <span className="text-2xl">{goal.icon}</span>
              <span className={`text-sm font-medium ${isSelected ? 'text-[#f5f0e8]' : 'text-[#f5f0e8]/80'}`}>
                {goal.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PreferencesStep
