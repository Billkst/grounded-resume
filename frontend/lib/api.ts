import type {
  EvidenceMappingResult,
  GapAcknowledgment,
  ResumeDraft,
  ResumeOutput,
  UserDecision,
  UserInput,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface CreateSessionResponse {
  sessionId: string
  status: string
}

export interface SessionDetail {
  sessionId: string
  status: string
  result?: {
    draft: ResumeDraft
    mappingResult: EvidenceMappingResult
  }
  finalOutput?: ResumeOutput
}

export interface SubmitDecisionsPayload {
  userDecisions: UserDecision[]
  gapAcknowledgments?: GapAcknowledgment[]
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export function createSession(input: UserInput): Promise<CreateSessionResponse> {
  return requestJson<CreateSessionResponse>('/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getSession(sessionId: string): Promise<SessionDetail> {
  return requestJson<SessionDetail>(`/sessions/${encodeURIComponent(sessionId)}`)
}

export function submitSessionDecisions(
  sessionId: string,
  payload: SubmitDecisionsPayload
): Promise<SessionDetail> {
  return requestJson<SessionDetail>(
    `/sessions/${encodeURIComponent(sessionId)}/decisions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  )
}
