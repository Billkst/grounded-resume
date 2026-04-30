import { mockBullets } from "@/lib/mock-data"
import ConfirmationBoard from "@/components/confirmation-board"

export default function ConfirmationPage() {
  return (
    <main className="flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-charcoal">
          确认你的简历
        </h1>
        <p className="mt-4 font-serif text-lg italic text-charcoal/70">
          请审阅以下生成内容，确认每一处表达都有真实依据
        </p>
        <div className="mt-3 h-px w-12 bg-terracotta mx-auto" />
      </header>

      <div className="w-full">
        <ConfirmationBoard bullets={mockBullets} />
      </div>
    </main>
  )
}
