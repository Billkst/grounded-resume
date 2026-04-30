"use client"

import { useState } from "react"
import type { GapItem, GapUserAction } from "@/lib/types"

interface GapReportProps {
  gaps: GapItem[]
}

const severityConfig = {
  critical: {
    border: "border-l-softred",
    badge: "bg-softred/10 text-softred",
    label: "严重",
  },
  major: {
    border: "border-l-amber",
    badge: "bg-amber/10 text-amber",
    label: "重要",
  },
  minor: {
    border: "border-l-sage",
    badge: "bg-sage/10 text-sage",
    label: "轻微",
  },
}

export default function GapReport({ gaps }: GapReportProps) {
  const [actions, setActions] = useState<Record<string, GapUserAction | null>>({})

  const handleAction = (gapId: string, action: GapUserAction) => {
    setActions((prev) => ({ ...prev, [gapId]: action }))
  }

  if (gaps.length === 0) {
    return (
      <div className="rounded-xl border border-charcoal/8 bg-warmgray/50 p-10 text-center">
        <p className="font-serif text-lg text-charcoal/70">
          未发现明显 Gap，素材覆盖度良好。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {gaps.map((gap) => {
        const config = severityConfig[gap.severity]
        const currentAction = actions[gap.id]

        return (
          <div
            key={gap.id}
            className={`rounded-xl border border-charcoal/8 border-l-4 ${config.border} bg-cream p-6 shadow-sm transition hover:shadow-md`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${config.badge}`}
              >
                {config.label}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-charcoal/40">
                {gap.gapType.replace("_", " ")}
              </span>
            </div>

            <p className="mb-3 leading-relaxed text-charcoal/90">
              {gap.description}
            </p>

            {gap.recommendation && (
              <div className="mb-4 rounded-lg bg-warmgray/60 px-4 py-3">
                <p className="text-sm leading-relaxed text-charcoal/80">
                  <span className="font-semibold text-charcoal">建议：</span>
                  {gap.recommendation}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              {!currentAction ? (
                <>
                  <button
                    onClick={() => handleAction(gap.id, "accept")}
                    className="rounded-lg border border-sage/30 bg-sage/10 px-4 py-2 text-sm font-medium text-sage transition hover:bg-sage/20"
                  >
                    接受缺口
                  </button>
                  <button
                    onClick={() => handleAction(gap.id, "will_supplement")}
                    className="rounded-lg border border-terracotta/30 bg-terracotta/10 px-4 py-2 text-sm font-medium text-terracotta transition hover:bg-terracotta/20"
                  >
                    后续补充
                  </button>
                  <button
                    onClick={() => handleAction(gap.id, "acknowledge")}
                    className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal/60 transition hover:bg-charcoal/5"
                  >
                    已知悉
                  </button>
                </>
              ) : (
                <span className="rounded-lg bg-charcoal/5 px-4 py-2 text-sm font-medium text-charcoal/60">
                  {currentAction === "accept" && "已接受此缺口"}
                  {currentAction === "will_supplement" && "标记为后续补充"}
                  {currentAction === "acknowledge" && "已知晓"}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
