import { mockBullets } from "@/lib/mock-data"
import ConfirmationBoard from "@/components/confirmation-board"

export default function ConfirmationPage() {
  const bulletCount = mockBullets.length
  const safeCount = mockBullets.filter((b) => b.riskLevel === "safe").length
  const warningCount = mockBullets.filter(
    (b) => b.riskLevel === "warning" || b.riskLevel === "caution"
  ).length
  const redlineCount = mockBullets.filter((b) => b.riskLevel === "redline").length
  const coverage = 0.65
  const confidence = 0.72

  return (
    <main className="min-h-screen bg-ink text-paper">
      <div className="border-b border-bone/10 bg-graphite/30">
        <div className="px-6 py-5 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-oxidized-cyan animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">
              Case File
            </span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <h1 className="font-display text-3xl lg:text-5xl font-medium tracking-tight text-paper">
                CONFIRMATION REVIEW
              </h1>
              <p className="mt-2 font-interface text-sm text-bone/50">
                证据审查室 — 请逐一核实每处表达的证据支撑
              </p>
            </div>
            <div className="flex flex-wrap gap-8 font-mono text-xs">
              <div>
                <span className="block text-bone/30 text-[10px] uppercase tracking-[0.15em] mb-1">
                  Target
                </span>
                <span className="text-bone">字节跳动 · AI产品经理实习生</span>
              </div>
              <div>
                <span className="block text-bone/30 text-[10px] uppercase tracking-[0.15em] mb-1">
                  Coverage
                </span>
                <span className="text-oxidized-cyan">{Math.round(coverage * 100)}%</span>
              </div>
              <div>
                <span className="block text-bone/30 text-[10px] uppercase tracking-[0.15em] mb-1">
                  Confidence
                </span>
                <span className="text-brass">{Math.round(confidence * 100)}%</span>
              </div>
              <div>
                <span className="block text-bone/30 text-[10px] uppercase tracking-[0.15em] mb-1">
                  Evidence
                </span>
                <span className="text-evidence-green">{safeCount}</span>
                <span className="text-bone/30"> / </span>
                <span className="text-warning-amber">{warningCount}</span>
                <span className="text-bone/30"> / </span>
                <span className="text-verdict-red">{redlineCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 lg:px-12">
        <div className="mb-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-bone/5" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/30">
            {bulletCount} Items Pending Review
          </span>
          <div className="h-px flex-1 bg-bone/5" />
        </div>
        <ConfirmationBoard bullets={mockBullets} />
      </div>
    </main>
  )
}
