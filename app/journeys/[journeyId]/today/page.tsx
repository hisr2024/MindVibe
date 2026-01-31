import TodayStepClient from './TodayStepClient'

export const metadata = {
  title: "Today's Journey Step | KIAAN — MindVibe Companion",
  description: 'Continue your wisdom journey with today\'s teaching, reflection, and practice. Transform your inner world one day at a time.'
}

interface PageProps {
  params: Promise<{ journeyId: string }>
}

export default async function TodayStepPage({ params }: PageProps) {
  const { journeyId } = await params
  return <TodayStepClient journeyId={journeyId} />
}
