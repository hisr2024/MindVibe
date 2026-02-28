import GuidedJourneyClient from './GuidedJourneyClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Journey | Sakha',
  description: 'Continue your guided journey of transformation through Bhagavad Gita wisdom.',
}

export default async function GuidedJourneyPage({ params }: PageProps) {
  const { id } = await params
  return <GuidedJourneyClient journeyId={id} />
}
