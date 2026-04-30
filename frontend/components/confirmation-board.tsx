"use client"

import { ResumeBullet } from "@/lib/types"
import EvidenceCard from "./evidence-card"

interface ConfirmationBoardProps {
  bullets: ResumeBullet[]
}

const expressionLabels: Record<string, string> = {
  literal: "原文",
  conservative: "保守",
  standard: "标准",
  emphasized: "强调",
}

const riskLabels: Record<string, string> = {
  safe: "安全",
  caution: "注意",
  warning: "警告",
  redline: "红线",
}

function getExpressionClasses(level: string): string {
  switch (level) {
    case "conservative":
      return "text-bone/60 border-bone/10"
    case "emphasized":
      return "text-brass border-brass/20"
    case "literal":
      return "text-bone/70 border-bone/10"
    case "standard":
      return "text-paper border-paper/10"
    default:
      return "text-paper border-paper/10"
  }
}

function getRiskClasses(level: string): string {
  switch (level) {
    case "safe":
      return "text-evidence-green border-evidence-green/20"
    case "warning":
    case "caution":
      return "text-warning-amber border-warning-amber/20"
    case "redline":
      return "text-verdict-red border-verdict-red/20"
    default:
      return "text-paper border-paper/10"
  }
}

export default function ConfirmationBoard({ bullets }: ConfirmationBoardProps) {
  return (
    <div className="space-y-4">
      {bullets.map((bullet) => {
        const expressionLabel = expressionLabels[bullet.expressionLevel] || bullet.expressionLevel
        const riskLabel = riskLabels[bullet.riskLevel] || bullet.riskLevel
        const expressionClasses = getExpressionClasses(bullet.expressionLevel)
        const riskClasses = getRiskClasses(bullet.riskLevel)

        const directQuotes =
          bullet.rewriteChain.length > 0 ? [bullet.rewriteChain[0].from] : []

        const mappingReasoning =
          bullet.rewriteChain.length > 0
            ? bullet.rewriteChain.map((s) => s.reason).join("；")
            : "基于证据映射自动生成"

        return (
          <div
            key={bullet.id}
            className="group relative rounded-lg border border-bone/8 bg-graphite/40 p-5 transition-all duration-300 hover:border-bone/20 hover:shadow-xl hover:shadow-ink/50 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-bone/5">
              <span className="font-mono text-[11px] text-bone/50 tracking-wider">
                EVIDENCE #{bullet.id}
              </span>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium border font-mono uppercase tracking-wider ${riskClasses}`}
              >
                {riskLabel}
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
              <div className="flex-[1.3] flex flex-col gap-3 min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/30">
                  简历表达
                </span>
                <p className="font-display text-base leading-relaxed text-paper">
                  {bullet.text}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <span
                    className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium border font-mono uppercase tracking-wider ${expressionClasses}`}
                  >
                    {expressionLabel}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/30">
                  证据来源
                </span>
                <EvidenceCard
                  sourceMaterialTitle="原始素材片段"
                  directQuotes={directQuotes}
                />
              </div>

              <div className="flex-[1.1] flex flex-col gap-3 min-w-0">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/30">
                  映射分析
                </span>
                <p className="font-interface text-sm leading-relaxed text-bone/70">
                  {mappingReasoning}
                </p>
                <div className="mt-auto flex gap-2 pt-3">
                  <button
                    type="button"
                    className="flex-1 rounded border border-brass/30 px-3 py-2 text-xs font-medium text-brass transition hover:bg-brass/10 hover:border-brass/60"
                  >
                    认可
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded border border-oxidized-cyan/30 px-3 py-2 text-xs font-medium text-oxidized-cyan transition hover:bg-oxidized-cyan/10 hover:border-oxidized-cyan/60"
                  >
                    修改
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded border border-verdict-red/30 px-3 py-2 text-xs font-medium text-verdict-red transition hover:bg-verdict-red/10 hover:border-verdict-red/60"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
