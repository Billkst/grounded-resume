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
      return "bg-charcoal/5 text-charcoal/60"
    case "emphasized":
      return "bg-terracotta/10 text-terracotta"
    case "literal":
      return "bg-charcoal/5 text-charcoal/70"
    case "standard":
      return "bg-cream text-charcoal border border-charcoal/10"
    default:
      return "bg-cream text-charcoal border border-charcoal/10"
  }
}

function getRiskClasses(level: string): string {
  switch (level) {
    case "safe":
      return "bg-sage/10 text-sage"
    case "warning":
    case "caution":
      return "bg-amber/10 text-amber"
    case "redline":
      return "bg-softred/10 text-softred"
    default:
      return "bg-cream text-charcoal border border-charcoal/10"
  }
}

export default function ConfirmationBoard({ bullets }: ConfirmationBoardProps) {
  return (
    <div className="space-y-6">
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
            className="flex flex-col gap-6 rounded-xl border border-charcoal/8 bg-warmgray p-6 md:grid md:grid-cols-3 md:gap-6"
          >
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
                简历表达
              </h3>
              <p className="font-serif text-base leading-relaxed text-charcoal">
                {bullet.text}
              </p>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${expressionClasses}`}
                >
                  {expressionLabel}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${riskClasses}`}
                >
                  {riskLabel}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
                证据来源
              </h3>
              <EvidenceCard
                sourceMaterialTitle="原始素材片段"
                directQuotes={directQuotes}
              />
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
                映射分析
              </h3>
              <p className="text-sm leading-relaxed text-charcoal/80">
                {mappingReasoning}
              </p>
              <div className="mt-auto flex gap-2 pt-3">
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-sage/10 px-3 py-2 text-sm font-medium text-sage transition hover:bg-sage/20"
                >
                  认可
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-amber/10 px-3 py-2 text-sm font-medium text-amber transition hover:bg-amber/20"
                >
                  修改
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-softred/10 px-3 py-2 text-sm font-medium text-softred transition hover:bg-softred/20"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
