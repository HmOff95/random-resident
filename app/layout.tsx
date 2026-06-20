import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Random Resident',
  description: 'A Tomodachi Life-inspired web app prototype',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
