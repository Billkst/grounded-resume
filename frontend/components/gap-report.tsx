"use client"

import { useState } from "react"
import type { GapItem, GapUserAction } from "@/lib/types"

interface GapReportProps {
  gaps: GapItem[]
}

const severityConfig = {
  critical: {
    border: "border-l-verdict-red",
    badge: "bg-verdict-red/10 text-verdict-red",
    label: "严重",
    bar: "bg-verdict-red",
  },
  major: {
    border: "border-l-warning-amber",
    badge: "bg-warning-amber/10 text-warning-amber",
    label: "重要",
    bar: "bg-warning-amber",
  },
  minor: {
    border: "border-l-evidence-green",
    badge: "bg-evidence-green/10 text-evidence-green",
    label: "轻微",
    bar: "bg-evidence-green",
  },
}

export default function GapReport({ gaps }: GapReportProps) {
  const [actions, setActions] = useState<Record<string, GapUserAction | null>>(
    {}
  )

  const handleAction = (gapId: string, action: GapUserAction) => {
    setActions((prev) => ({ ...prev, [gapId]: action }))
  }

  if (gaps.length === 0) {
    return (
      <div className="border border-bone/10 bg-graphite p-10 text-center">
        <p className="font-serif text-lg text-bone/70">
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
        const isAccepted = currentAction === "accept"

        return (
          <div
            key={gap.id}
            className={`relative overflow-hidden border border-bone/10 border-l-4 ${config.border} bg-graphite transition ${
              isAccepted ? "opacity-60" : "opacity-100"
            }`}
          >
            <div className="p-6">
              <div className="mb-3 flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold ${config.badge}`}
                >
                  {isAccepted && (
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {config.label}
                </span>
                <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-bone/40">
                  {gap.gapType.replace("_", " ")}
                </span>
              </div>

              <p className="mb-3 font-serif leading-relaxed text-bone/90">
                {gap.description}
              </p>

              {gap.recommendation && (
                <div className="mb-4 border-l-2 border-bone/20 bg-bone/5 px-4 py-3">
                  <p className="font-serif text-sm leading-relaxed text-bone/80">
                    <span className="font-semibold text-paper">建议：</span>
                    {gap.recommendation}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {!currentAction ? (
                  <>
                    <button
                      onClick={() => handleAction(gap.id, "accept")}
                      className="border border-evidence-green/40 px-4 py-2 text-sm font-medium text-evidence-green transition hover:bg-evidence-green/10"
                    >
                      接受缺口
                    </button>
                    <button
                      onClick={() => handleAction(gap.id, "will_supplement")}
                      className="border border-warning-amber/40 px-4 py-2 text-sm font-medium text-warning-amber transition hover:bg-warning-amber/10"
                    >
                      后续补充
                    </button>
                    <button
                      onClick={() => handleAction(gap.id, "acknowledge")}
                      className="border border-bone/20 px-4 py-2 text-sm font-medium text-bone/60 transition hover:bg-bone/5"
                    >
                      已知悉
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {currentAction === "accept" && (
                      <span className="inline-flex items-center gap-1.5 border border-evidence-green/30 bg-evidence-green/10 px-4 py-2 text-sm font-medium text-evidence-green">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        已接受此缺口
                      </span>
                    )}
                    {currentAction === "will_supplement" && (
                      <span className="inline-flex items-center gap-1.5 border border-warning-amber/30 bg-warning-amber/10 px-4 py-2 text-sm font-medium text-warning-amber">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        标记为后续补充
                      </span>
                    )}
                    {currentAction === "acknowledge" && (
                      <span className="inline-flex items-center gap-1.5 border border-bone/20 bg-bone/5 px-4 py-2 text-sm font-medium text-bone/60">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        已知晓
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
