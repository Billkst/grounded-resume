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
          className="font-display text-3xl font-bold tracking-tight text-ink"
        >
          {parseInline(trimmed.slice(2))}
        </h1>
      )
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="mt-6 mb-3 font-display text-xl font-semibold text-ink"
        >
          {parseInline(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed.startsWith("- ")) {
      elements.push(
        <li
          key={i}
          className="ml-5 list-disc py-1 font-serif leading-relaxed text-ink/90"
        >
          {parseInline(trimmed.slice(2))}
        </li>
      )
    } else {
      elements.push(
        <p key={i} className="font-serif leading-relaxed text-ink/90">
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
        <strong key={idx} className="font-semibold text-ink">
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
    <div className="mx-auto max-w-3xl">
      <div className="relative">
        <div className="absolute inset-0 translate-x-1 translate-y-2 bg-ink/30 blur-md" />

        <div className="relative bg-paper p-10 shadow-2xl">
          <div className="mb-8 flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="inline-flex items-center gap-2 border border-evidence-green/30 bg-evidence-green/10 px-3 py-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-evidence-green" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-evidence-green">
                Level 2 Declaration
              </span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40">
              AI-Assisted · User Verified
            </span>
          </div>

          <div className="space-y-2">{elements}</div>

          <div className="mt-10 border-t border-ink/10 pt-4 text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/30">
              Grounded Resume · Forensic Atelier
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
