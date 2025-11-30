import './globals.css'

export const metadata = {
  title: 'MindVibe - Mental Health App',
  description: 'Breathe. Focus. Take care of your mental health.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-zinc-100">{children}</body>
    </html>
  )
}