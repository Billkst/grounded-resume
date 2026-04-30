import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grounded Resume',
  description: 'Forensic resume atelier',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head />
      <body className="min-h-screen bg-ink text-paper antialiased">
        {children}
      </body>
    </html>
  )
}
