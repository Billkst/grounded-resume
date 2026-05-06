import type { Metadata } from 'next'
import './globals.css'
import FluidBackground from '@/components/fluid-background'

export const metadata: Metadata = {
  title: 'Grounded Resume — 发现你的理想简历',
  description: '输入目标岗位 JD，AI 分析差距、生成理想简历与路线图',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0A0A0F] text-white antialiased">
        <FluidBackground />
        {children}
      </body>
    </html>
  )
}
