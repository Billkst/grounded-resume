"use client"

import { useState } from "react"
import ResumePreview from "@/components/resume-preview"
import GapReport from "@/components/gap-report"
import { mockOutput, mockGaps } from "@/lib/mock-data"

type TabKey = "resume" | "evidence" | "gaps" | "risks" | "guide"

const tabs: { key: TabKey; label: string }[] = [
  { key: "resume", label: "简历预览" },
  { key: "evidence", label: "证据映射" },
  { key: "gaps", label: "Gap 报告" },
  { key: "risks", label: "风险摘要" },
  { key: "guide", label: "修改指南" },
]

function renderMarkdownContent(content: string) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") continue

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={i}
          className="mt-5 mb-2 font-serif text-lg font-semibold text-charcoal"
        >
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h3
          key={i}
          className="mt-5 mb-2 font-serif text-lg font-semibold text-charcoal"
        >
          {trimmed.slice(2)}
        </h3>
      )
    } else if (trimmed.startsWith("| ") && trimmed.endsWith(" |")) {
      if (trimmed.includes("---")) continue
      elements.push(
        <div
          key={i}
          className="border-b border-charcoal/8 py-2 text-sm text-charcoal/80"
        >
          {trimmed}
        </div>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <p key={i} className="py-1 leading-relaxed text-charcoal/90">
          {trimmed}
        </p>
      )
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li
          key={i}
          className="ml-5 list-disc py-1 leading-relaxed text-charcoal/90"
        >
          {trimmed.slice(2)}
        </li>
      )
    } else {
      elements.push(
        <p key={i} className="leading-relaxed text-charcoal/90">
          {trimmed}
        </p>
      )
    }
  }

  return elements
}

export default function ResultPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("resume")

  const evidenceAttachment = mockOutput.attachments.find(
    (a) => a.type === "evidence_map"
  )
  const riskAttachment = mockOutput.attachments.find(
    (a) => a.type === "risk_summary"
  )
  const guideAttachment = mockOutput.attachments.find(
    (a) => a.type === "modification_guide"
  )

  return (
    <main className="flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-charcoal">
          生成结果
        </h1>
        <p className="mt-3 font-serif text-base italic text-charcoal/70">
          {mockOutput.metadata.targetJob.companyName} ·{" "}
          {mockOutput.metadata.targetJob.jobTitle}
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-charcoal/50">
          <span>置信度 {(mockOutput.metadata.confidence * 100).toFixed(0)}%</span>
          <span>素材覆盖率 {(mockOutput.metadata.materialCoverage * 100).toFixed(0)}%</span>
          <span>Gap 数 {mockOutput.metadata.gapCount}</span>
        </div>
      </header>

      <div className="w-full">
        <div className="mb-6 flex flex-wrap gap-2 border-b border-charcoal/10 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-b-2 border-terracotta text-charcoal"
                  : "text-charcoal/50 hover:text-charcoal/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === "resume" && (
            <ResumePreview markdown={mockOutput.resumeMarkdown || ""} />
          )}

          {activeTab === "evidence" && (
            <div className="rounded-xl border border-charcoal/8 bg-cream p-8 shadow-sm">
              {evidenceAttachment ? (
                <div>{renderMarkdownContent(evidenceAttachment.content)}</div>
              ) : (
                <p className="text-center text-charcoal/50">暂无证据映射数据</p>
              )}
            </div>
          )}

          {activeTab === "gaps" && <GapReport gaps={mockGaps} />}

          {activeTab === "risks" && (
            <div className="rounded-xl border border-charcoal/8 bg-cream p-8 shadow-sm">
              {riskAttachment ? (
                <div>{renderMarkdownContent(riskAttachment.content)}</div>
              ) : (
                <p className="text-center text-charcoal/50">暂无风险数据</p>
              )}
            </div>
          )}

          {activeTab === "guide" && (
            <div className="rounded-xl border border-charcoal/8 bg-cream p-8 shadow-sm">
              {guideAttachment ? (
                <div>{renderMarkdownContent(guideAttachment.content)}</div>
              ) : (
                <p className="text-center text-charcoal/50">暂无修改指南</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
