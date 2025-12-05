import { Metadata } from 'next'
import KarmaResetClient from './KarmaResetClient'

export const metadata: Metadata = {
  title: 'Karma Reset Ritual - 4-Part Plan | MindVibe',
  description: 'A calm, focused 4-part reset ritual to process moments and return to your values.',
}

export default function KarmaResetPage() {
  return <KarmaResetClient />
}
