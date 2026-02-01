import JourneyFormClient from '../../JourneyFormClient'

export const metadata = {
  title: 'Edit Journey | MindVibe',
  description: 'Update your journey details.',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditJourneyPage({ params }: PageProps) {
  const { id } = await params
  return <JourneyFormClient mode="edit" journeyId={id} />
}
