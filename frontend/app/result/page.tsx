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
          className="mt-5 mb-2 font-display text-lg font-semibold text-paper"
        >
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h3
          key={i}
          className="mt-5 mb-2 font-display text-lg font-semibold text-paper"
        >
          {trimmed.slice(2)}
        </h3>
      )
    } else if (trimmed.startsWith("| ") && trimmed.endsWith(" |")) {
      if (trimmed.includes("---")) continue
      elements.push(
        <div
          key={i}
          className="border-b border-bone/10 py-2 text-sm text-bone/80"
        >
          {trimmed}
        </div>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      elements.push(
        <p key={i} className="py-1 leading-relaxed text-bone/90">
          {trimmed}
        </p>
      )
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li
          key={i}
          className="ml-5 list-disc py-1 leading-relaxed text-bone/90"
        >
          {trimmed.slice(2)}
        </li>
      )
    } else {
      elements.push(
        <p key={i} className="leading-relaxed text-bone/90">
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

  const metrics = [
    {
      label: "置信度",
      value: `${(mockOutput.metadata.confidence * 100).toFixed(0)}%`,
    },
    {
      label: "素材覆盖率",
      value: `${(mockOutput.metadata.materialCoverage * 100).toFixed(0)}%`,
    },
    { label: "Gap 数", value: String(mockOutput.metadata.gapCount) },
    { label: "版本", value: mockOutput.metadata.version },
  ]

  return (
    <main className="min-h-screen bg-ink text-paper">
      <header className="border-b border-bone/10 px-8 pt-10 pb-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-paper">
              生成报告
            </h1>
            <p className="mt-3 font-serif text-base italic text-bone/70">
              {mockOutput.metadata.targetJob.companyName} ·{" "}
              {mockOutput.metadata.targetJob.jobTitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="min-w-[120px] border border-bone/10 bg-graphite px-5 py-3"
              >
                <div className="font-mono text-[10px] uppercase tracking-widest text-bone/50">
                  {m.label}
                </div>
                <div className="mt-1 font-display text-2xl text-paper">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-180px)]">
        <nav className="w-56 border-r border-bone/10 bg-ink py-6">
          <div className="space-y-1 px-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full border-l-2 px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "border-brass bg-brass/10 text-brass"
                    : "border-transparent text-bone/50 hover:bg-bone/5 hover:text-bone"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <section className="flex-1 bg-ink p-8">
          {activeTab === "resume" && (
            <ResumePreview markdown={mockOutput.resumeMarkdown || ""} />
          )}

          {activeTab === "evidence" && (
            <div className="border border-bone/10 bg-graphite p-8">
              {evidenceAttachment ? (
                <div>{renderMarkdownContent(evidenceAttachment.content)}</div>
              ) : (
                <p className="text-center text-bone/50">暂无证据映射数据</p>
              )}
            </div>
          )}

          {activeTab === "gaps" && <GapReport gaps={mockGaps} />}

          {activeTab === "risks" && (
            <div className="border border-bone/10 bg-graphite p-8">
              {riskAttachment ? (
                <div>{renderMarkdownContent(riskAttachment.content)}</div>
              ) : (
                <p className="text-center text-bone/50">暂无风险数据</p>
              )}
            </div>
          )}

          {activeTab === "guide" && (
            <div className="border border-bone/10 bg-graphite p-8">
              {guideAttachment ? (
                <div>{renderMarkdownContent(guideAttachment.content)}</div>
              ) : (
                <p className="text-center text-bone/50">暂无修改指南</p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
