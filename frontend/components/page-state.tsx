'use client'

interface LoadingStateProps {
  title?: string
  message?: string
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry: () => void
}

export function LoadingState({
  title = '正在分析素材',
  message = '系统正在提取证据、映射 JD，并生成可确认的简历草稿。',
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-md rounded-xl border border-bone/10 bg-graphite/80 p-8 text-center shadow-2xl shadow-ink/40 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-oxidized-cyan/40 to-transparent" />
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-oxidized-cyan/20 bg-oxidized-cyan/10">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxidized-cyan opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-oxidized-cyan" />
          </span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxidized-cyan">
          Processing
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-paper">
          {title}
        </h2>
        <p className="mt-3 font-interface text-sm leading-relaxed text-bone/60">
          {message}
        </p>
      </div>
    </div>
  )
}

export function ErrorState({
  title = '处理失败',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-md rounded-xl border border-verdict-red/30 bg-graphite/80 p-8 text-center shadow-2xl shadow-ink/40 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-verdict-red/50 to-transparent" />
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-verdict-red/25 bg-verdict-red/10">
          <span className="font-mono text-xl text-verdict-red">!</span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-verdict-red">
          Error
        </p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-paper">
          {title}
        </h2>
        <p className="mt-3 font-interface text-sm leading-relaxed text-bone/60">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded border border-verdict-red/30 px-5 py-2.5 font-interface text-sm font-medium text-verdict-red transition hover:border-verdict-red/60 hover:bg-verdict-red/10"
        >
          重试
        </button>
      </div>
    </div>
  )
}
