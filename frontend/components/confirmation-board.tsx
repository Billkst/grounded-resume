"use client"

import { useState } from "react"
import { ResumeBullet, UserDecision, UserDecisionValue } from "@/lib/types"
import EvidenceCard from "./evidence-card"

interface ConfirmationBoardProps {
  bullets: ResumeBullet[]
  isSubmitting: boolean
  onSubmit: (decisions: UserDecision[]) => void
}

const decisionLabels: Record<UserDecisionValue, string> = {
  approve: "认可",
  revise: "修改",
  reject: "拒绝",
}

const decisionClasses: Record<UserDecisionValue, string> = {
  approve: "border-brass/30 text-brass hover:bg-brass/10 hover:border-brass/60",
  revise:
    "border-oxidized-cyan/30 text-oxidized-cyan hover:bg-oxidized-cyan/10 hover:border-oxidized-cyan/60",
  reject:
    "border-verdict-red/30 text-verdict-red hover:bg-verdict-red/10 hover:border-verdict-red/60",
}

const activeDecisionClasses: Record<UserDecisionValue, string> = {
  approve: "bg-brass/10 border-brass/60",
  revise: "bg-oxidized-cyan/10 border-oxidized-cyan/60",
  reject: "bg-verdict-red/10 border-verdict-red/60",
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

export default function ConfirmationBoard({
  bullets,
  isSubmitting,
  onSubmit,
}: ConfirmationBoardProps) {
  const [decisions, setDecisions] = useState<Record<string, UserDecisionValue>>({})
  const [revisions, setRevisions] = useState<Record<string, string>>({})

  function selectDecision(bulletId: string, decision: UserDecisionValue) {
    setDecisions((current) => ({ ...current, [bulletId]: decision }))
    if (decision === "revise") {
      setRevisions((current) => ({
        ...current,
        [bulletId]: current[bulletId] ?? bullets.find((bullet) => bullet.id === bulletId)?.text ?? "",
      }))
    }
  }

  function updateRevision(bulletId: string, revisedText: string) {
    setRevisions((current) => ({ ...current, [bulletId]: revisedText }))
  }

  function buildPayload(): UserDecision[] {
    const timestamp = new Date().toISOString()

    return bullets.map((bullet) => {
      const decision = decisions[bullet.id] ?? "approve"
      const revisedText = decision === "revise" ? revisions[bullet.id] || bullet.text : undefined

      return {
        confirmationItemId: bullet.id,
        decision,
        revisedText,
        timestamp,
      }
    })
  }

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
        const selectedDecision = decisions[bullet.id] ?? "approve"

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
                <div className="mt-auto flex flex-col gap-3 pt-3">
                  <div className="flex gap-2">
                    {(["approve", "revise", "reject"] as UserDecisionValue[]).map(
                      (decision) => (
                        <button
                          key={decision}
                          type="button"
                          onClick={() => selectDecision(bullet.id, decision)}
                          className={`flex-1 rounded border px-3 py-2 text-xs font-medium transition ${decisionClasses[decision]} ${
                            selectedDecision === decision ? activeDecisionClasses[decision] : ""
                          }`}
                        >
                          {decisionLabels[decision]}
                        </button>
                      )
                    )}
                  </div>
                  {selectedDecision === "revise" && (
                    <textarea
                      value={revisions[bullet.id] ?? bullet.text}
                      onChange={(event) => updateRevision(bullet.id, event.target.value)}
                      className="min-h-24 w-full rounded border border-oxidized-cyan/20 bg-ink/60 px-3 py-2 font-interface text-sm leading-relaxed text-paper outline-none transition placeholder:text-bone/30 focus:border-oxidized-cyan/60 focus:bg-ink/80"
                      placeholder="输入修改后的简历表达"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div className="sticky bottom-4 flex justify-end pt-2">
        <button
          type="button"
          onClick={() => onSubmit(buildPayload())}
          disabled={isSubmitting}
          className="rounded border border-brass/40 bg-brass/10 px-6 py-3 font-interface text-sm font-semibold text-brass shadow-lg shadow-ink/40 transition hover:border-brass/70 hover:bg-brass/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "提交中..." : "提交确认并生成结果"}
        </button>
      </div>
    </div>
  )
}
