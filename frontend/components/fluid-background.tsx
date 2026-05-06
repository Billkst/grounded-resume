'use client'

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* Animated gradient orbs */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-drift-1"
        style={{
          background: 'radial-gradient(circle, rgba(76, 29, 149, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '-10%',
          left: '-5%',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-drift-2"
        style={{
          background: 'radial-gradient(circle, rgba(190, 24, 93, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '40%',
          right: '-10%',
        }}
      />
      <div
        className="absolute w-[450px] h-[450px] rounded-full animate-drift-3"
        style={{
          background: 'radial-gradient(circle, rgba(14, 116, 144, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          bottom: '-10%',
          left: '30%',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-drift-1"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          top: '20%',
          left: '60%',
          animationDelay: '-5s',
        }}
      />
    </div>
  )
}
