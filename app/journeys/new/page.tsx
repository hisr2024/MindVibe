import JourneyFormClient from '../JourneyFormClient'

export const metadata = {
  title: 'Create Journey | MindVibe',
  description: 'Create a new personal journey to track your goals and progress.',
}

export default function NewJourneyPage() {
  return <JourneyFormClient mode="create" />
}
