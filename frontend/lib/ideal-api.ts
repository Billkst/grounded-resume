import type { GenerateRequest, GenerateResponse } from './ideal-types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function createGeneration(input: GenerateRequest): Promise<{ session_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail || 'Request failed');
  }
  return res.json();
}

export async function getGeneration(sessionId: string): Promise<GenerateResponse> {
  const res = await fetch(`${API_BASE}/api/generate/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function pollGeneration(
  sessionId: string,
  onUpdate: (resp: GenerateResponse) => void,
  onError: (err: Error) => void,
  intervalMs = 1500,
) {
  const timer = setInterval(async () => {
    try {
      const resp = await getGeneration(sessionId);
      onUpdate(resp);
      if (resp.status === 'completed' || resp.status === 'failed') {
        clearInterval(timer);
      }
    } catch (err) {
      clearInterval(timer);
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  }, intervalMs);
  return () => clearInterval(timer);
}
