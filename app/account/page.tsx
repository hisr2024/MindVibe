import { Metadata } from 'next'
import AccountPageClient from './AccountPageClient'

export const metadata: Metadata = {
  title: 'Account Access | Sakha',
  description: 'Create an account or log in with a secure password to keep your Sakha experience synced across devices.',
}

export default function AccountPage() {
  return <AccountPageClient />
}
