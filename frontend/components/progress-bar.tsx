'use client'

interface ProgressBarProps {
  currentStep: string
  totalSteps: number
}

const STEP_LABELS: Record<string, string> = {
  pending: '准备中',
  parse: '解析输入',
  generate: '生成简历',
  complete: '完成',
  parse_jd: '解析岗位需求',
  parse_materials: '分析个人素材',
  map_evidence: '映射证据关系',
  classify_density: '评估素材密度',
  plan_generation: '规划生成策略',
  generate_candidates: '生成候选简历',
  rerank_candidates: '重排候选简历',
  verify_claims: '验证证据声明',
  enforce_hard_rules: '强制执行规则',
  assemble_output: '组装最终输出',
  generate_draft: '生成简历草稿',
  validate_draft: '验证草稿质量',
}

const STEP_ORDER = [
  'pending',
  'parse',
  'generate',
  'complete',
]

function getStepIndex(step: string): number {
  // Handle fine-grained steps like "generate_candidates_2_of_5"
  // or completion steps like "generate_candidates_done_3_of_5"
  const baseStep = step.replace(/_done/, '').split('_').slice(0, -1).join('_') || step
  const index = STEP_ORDER.indexOf(baseStep)
  if (index >= 0) {
    // Try to extract progress within the step, e.g. "2_of_5" -> 40% into this step
    // or "done_3_of_5" -> 60% into this step
    const match = step.match(/_(\d+)_of_(\d+)$/)
    if (match) {
      const [, current, total] = match
      const subProgress = Number(current) / Number(total)
      return index + subProgress
    }
    return index
  }
  return 0
}

function getProgressPercent(currentStep: string, totalSteps: number): number {
  const index = getStepIndex(currentStep)
  const maxIndex = Math.max(totalSteps - 1, 1)
  const effectiveIndex = Math.min(index, maxIndex)
  return Math.round((effectiveIndex / maxIndex) * 100)
}

function getFineGrainedLabel(step: string): string {
  const isDone = step.includes('_done_')
  const match = step.match(/_(\d+)_of_(\d+)$/)
  if (!match) return ''
  const [, current, total] = match
  const baseStep = step.replace(/_done/, '').replace(/_\d+_of_\d+$/, '')
  const baseLabel = STEP_LABELS[baseStep] || baseStep
  const status = isDone ? '已完成' : '进行中'
  return `${baseLabel} ${status} (${current}/${total})`
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = getProgressPercent(currentStep, totalSteps)
  const currentIndex = getStepIndex(currentStep)
  const label = STEP_LABELS[currentStep] || currentStep
  const fineLabel = getFineGrainedLabel(currentStep)

  return (
    <div className="w-full max-w-md">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-oxidized-cyan">
          Processing
        </span>
        <span className="font-mono text-[10px] text-bone/50">
          {progress}%
        </span>
      </div>

      <div className="relative mb-6 h-1 overflow-hidden rounded-full bg-bone/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-oxidized-cyan to-brass transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </div>

      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl font-semibold text-paper">
          {label}
        </h2>
        {fineLabel && (
          <p className="mt-1 font-mono text-[10px] text-oxidized-cyan/70">
            {fineLabel}
          </p>
        )}
        <p className="mt-2 font-interface text-sm leading-relaxed text-bone/60">
          系统正在处理您的简历生成请求，请稍候…
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        {STEP_ORDER.slice(1).map((step, idx) => {
          const stepNum = idx + 1
          const isActive = idx < currentIndex
          const isCurrent = idx === currentIndex - 1

          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-all duration-500 ${
                  isCurrent
                    ? 'border-oxidized-cyan bg-oxidized-cyan/20 text-oxidized-cyan shadow-[0_0_12px_rgba(45,156,168,0.3)]'
                    : isActive
                      ? 'border-oxidized-cyan/50 bg-oxidized-cyan/10 text-oxidized-cyan/80'
                      : 'border-bone/15 bg-graphite/50 text-bone/30'
                }`}
              >
                {isActive && !isCurrent ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-center font-mono text-[9px] uppercase tracking-wider transition-all duration-500 ${
                  isCurrent
                    ? 'text-oxidized-cyan'
                    : isActive
                      ? 'text-bone/60'
                      : 'text-bone/25'
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function LoadingStateWithProgress({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-lg rounded-xl border border-bone/10 bg-graphite/80 p-8 text-center shadow-2xl shadow-ink/40 backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-oxidized-cyan/40 to-transparent" />
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-oxidized-cyan/20 bg-oxidized-cyan/10">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oxidized-cyan opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-oxidized-cyan" />
          </span>
        </div>
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      </div>
    </div>
  )
}
