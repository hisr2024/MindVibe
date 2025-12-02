import AdminLayout from './components/AdminLayout'

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayout>{children}</AdminLayout>
}
