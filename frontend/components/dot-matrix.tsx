'use client'

export default function DotMatrix() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.3,
      }}
    />
  )
}
