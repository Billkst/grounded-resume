import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grounded Resume',
  description: 'Editorial resume experience',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-cream text-charcoal antialiased">
        <div className="mx-auto max-w-3xl px-4 py-12">
          {children}
        </div>
      </body>
    </html>
  )
}
