import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard | MindVibe',
  description: 'Access MindVibe tools including secure journaling and guided chat from one dashboard.'
}

export default function DashboardPage() {
  return <DashboardClient />
}
