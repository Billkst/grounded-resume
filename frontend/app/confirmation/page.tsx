"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ConfirmationBoard from "@/components/confirmation-board"
import { ErrorState, LoadingState } from "@/components/page-state"
import { getSession, submitSessionDecisions, SessionDetail } from "@/lib/api"
import { flattenDraftBullets } from "@/lib/resume-format"
import type { UserDecision } from "@/lib/types"

function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setError("缺少 sessionId，无法加载确认数据。")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const nextSession = await getSession(sessionId)
      if (!nextSession.result?.draft) {
        throw new Error("当前会话还没有可确认的简历草稿。")
      }
      setSession(nextSession)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "加载确认数据失败。")
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  const bullets = useMemo(
    () => flattenDraftBullets(session?.result?.draft),
    [session?.result?.draft]
  )

  const targetJob = session?.result?.userInput?.targetJob
  const bulletCount = bullets.length
  const safeCount = bullets.filter((b) => b.riskLevel === "safe").length
  const warningCount = bullets.filter(
    (b) => b.riskLevel === "warning" || b.riskLevel === "caution"
  ).length
  const redlineCount = bullets.filter((b) => b.riskLevel === "redline").length
  const confidence = session?.result?.mappingResult.mappingConfidence ?? 0
  const coverage = bulletCount > 0 ? safeCount / bulletCount : 0

  async function handleSubmit(decisions: UserDecision[]) {
    if (!sessionId) {
      setError("缺少 sessionId，无法提交确认结果。")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await submitSessionDecisions(sessionId, {
        decisions,
        gapAcknowledgments: [],
      })
      router.push(`/result?sessionId=${sessionId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "提交确认结果失败。")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-ink text-paper">
        <LoadingState
          title="正在加载确认数据"
          message="系统正在读取本次会话生成的简历草稿与证据映射。"
        />
      </main>
    )
  }

  if (error || !session?.result) {
    return (
      <main className="min-h-screen bg-ink text-paper">
        <ErrorState
          title="确认数据加载失败"
          message={error || "当前会话没有可确认的数据。"}
          onRetry={fetchSession}
        />
      </main>
    )
  }

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
                <span className="text-bone">
                  {targetJob
                    ? `${targetJob.companyName} · ${targetJob.jobTitle}`
                    : "目标岗位信息缺失"}
                </span>
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
        <ConfirmationBoard
          bullets={bullets}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-ink text-paper">
          <LoadingState
            title="正在加载确认数据"
            message="系统正在读取本次会话生成的简历草稿与证据映射。"
          />
        </main>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}
