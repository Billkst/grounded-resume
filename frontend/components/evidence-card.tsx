interface EvidenceCardProps {
  sourceMaterialTitle: string
  directQuotes: string[]
}

export default function EvidenceCard({ sourceMaterialTitle, directQuotes }: EvidenceCardProps) {
  return (
    <div className="rounded-lg border-l-4 border-terracotta bg-cream p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-charcoal/50">
        {sourceMaterialTitle}
      </h4>
      <div className="space-y-2">
        {directQuotes.map((quote, i) => (
          <p key={i} className="text-sm leading-relaxed text-charcoal/80 italic">
            “{quote}”
          </p>
        ))}
        {directQuotes.length === 0 && (
          <p className="text-sm italic text-charcoal/40">无原始引用</p>
        )}
      </div>
    </div>
  )
}
