import { Metadata } from 'next'
import AccountPageClient from './AccountPageClient'

export const metadata: Metadata = {
  title: 'Account Access | MindVibe',
  description: 'Create an account or log in with a secure password to keep your MindVibe experience synced across devices.',
}

export default function AccountPage() {
  return <AccountPageClient />
}
