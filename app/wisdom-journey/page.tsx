import WisdomJourneyClient from './WisdomJourneyClient'

export const metadata = {
  title: 'Wisdom Journeys | MindVibe — AI-Powered Personalized Path',
  description:
    'Embark on personalized wisdom journeys through the Bhagavad Gita. AI-powered recommendations based on your mood patterns and journal themes guide you through multi-day verse sequences for inner peace and growth.',
}

export default function WisdomJourneyPage() {
  return <WisdomJourneyClient />
}
