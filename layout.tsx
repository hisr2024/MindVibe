import '../styles/globals.css'
export const metadata = { title: 'Aadi', description: 'Breathe. Focus. Do your part.' }
export default function RootLayout({ children }:{ children: React.ReactNode }){
  return <html lang="en"><body className="bg-black text-zinc-100">{children}</body></html>
}
