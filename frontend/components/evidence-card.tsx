interface EvidenceCardProps {
  sourceMaterialTitle: string
  directQuotes: string[]
}

export default function EvidenceCard({ sourceMaterialTitle, directQuotes }: EvidenceCardProps) {
  return (
    <div className="relative border-l-2 border-oxidized-cyan/50 pl-4 py-0.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-bone/40">
        {sourceMaterialTitle}
      </span>
      <div className="mt-2 space-y-2">
        {directQuotes.map((quote, i) => (
          <p
            key={i}
            className="font-interface text-sm leading-relaxed text-bone/80 italic"
          >
            <span className="text-oxidized-cyan/60 mr-0.5">{'"'}</span>
            {quote}
            <span className="text-oxidized-cyan/60 ml-0.5">{'"'}</span>
          </p>
        ))}
        {directQuotes.length === 0 && (
          <p className="font-interface text-sm italic text-bone/30">
            <span className="text-oxidized-cyan/40 mr-0.5">{'"'}</span>
            无原始引用
            <span className="text-oxidized-cyan/40 ml-0.5">{'"'}</span>
          </p>
        )}
      </div>
    </div>
  )
}
