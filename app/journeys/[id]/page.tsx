import JourneyDetailClient from './JourneyDetailClient'

export const metadata = {
  title: 'Journey Details | Sakha',
  description: 'View your journey details and track your progress.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function JourneyDetailPage({ params }: PageProps) {
  const { id } = await params
  return <JourneyDetailClient journeyId={id} />
}

