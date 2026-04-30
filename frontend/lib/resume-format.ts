import type { ResumeBullet, ResumeDraft, ResumeSection } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isResumeBullet(value: unknown): value is ResumeBullet {
  if (!isRecord(value)) return false

  return typeof value.id === 'string' && typeof value.text === 'string'
}

function isResumeSection(value: unknown): value is ResumeSection {
  if (!isRecord(value)) return false

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.order === 'number' &&
    Array.isArray(value.bullets) &&
    value.bullets.every(isResumeBullet)
  )
}

export function isResumeDraft(value: unknown): value is ResumeDraft {
  if (!isRecord(value)) return false

  return (
    typeof value.version === 'number' &&
    Array.isArray(value.sections) &&
    value.sections.every(isResumeSection) &&
    Array.isArray(value.generationLog) &&
    Array.isArray(value.riskFlags)
  )
}

export function flattenDraftBullets(value: unknown): ResumeBullet[] {
  if (!isResumeDraft(value)) return []

  return value.sections.flatMap((section) => section.bullets)
}

export function formatDraftMarkdown(value: unknown): string {
  if (!isResumeDraft(value)) return ''

  return [...value.sections]
    .sort((a, b) => a.order - b.order)
    .map(formatSectionMarkdown)
    .filter(Boolean)
    .join('\n\n')
}

function formatSectionMarkdown(section: ResumeSection): string {
  const heading = `## ${section.title}`
  const bullets = section.bullets.map((bullet) => `- ${bullet.text}`)

  if (bullets.length === 0) return heading

  return [heading, ...bullets].join('\n')
}
