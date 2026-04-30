"use client"

interface ResumePreviewProps {
  markdown: string
}

function parseMarkdownToElements(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === "") {
      continue
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="font-display text-3xl font-bold tracking-tight text-charcoal"
        >
          {parseInline(trimmed.slice(2))}
        </h1>
      )
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mt-6 mb-3 font-serif text-xl font-semibold text-charcoal"
        >
          {parseInline(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li
          key={i}
          className="ml-5 list-disc py-1 leading-relaxed text-charcoal/90"
        >
          {parseInline(trimmed.slice(2))}
        </li>
      )
    } else {
      elements.push(
        <p key={i} className="leading-relaxed text-charcoal/90">
          {parseInline(trimmed)}
        </p>
      )
    }
  }

  return elements
}

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-charcoal">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export default function ResumePreview({ markdown }: ResumePreviewProps) {
  const elements = parseMarkdownToElements(markdown)

  return (
    <div className="space-y-2">
      <blockquote className="mb-6 border-l-4 border-terracotta bg-warmgray/60 px-5 py-4 italic text-charcoal/80">
        <p className="font-serif text-sm leading-relaxed">
          本简历由 grounded-resume 基于您提供的真实素材生成，所有经历均来自原始输入。请在投递前仔细核对表述准确性。
        </p>
        <footer className="mt-2 text-xs text-charcoal/50 not-italic">
          — Level 2 声明：AI 辅助生成，用户负责最终内容真实性
        </footer>
      </blockquote>

      <div className="rounded-xl border border-charcoal/8 bg-cream p-8 shadow-sm">
        {elements}
      </div>
    </div>
  )
}
