'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { pollGeneration } from '@/lib/ideal-api';
import type { IdealResume, GapReport, GenerateResponse } from '@/lib/ideal-types';
import IdealResultView from '@/components/ideal-result-view';

const PROGRESS_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
  done: '完成',
};

const STEPS = ['job_profile', 'generating_resume', 'analyzing_gaps', 'done'];

export default function ResultPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-lg text-gray-700">加载中...</span>
          </div>
        </div>
      </main>
    }>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session');
  const [status, setStatus] = useState<string>('processing');
  const [progress, setProgress] = useState('');
  const [idealResume, setIdealResume] = useState<IdealResume | null>(null);
  const [gapReport, setGapReport] = useState<GapReport | null>(null);
  const [error, setError] = useState('');
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }

    const stop = pollGeneration(
      sessionId,
      (resp: GenerateResponse) => {
        if (stoppedRef.current) return;
        setStatus(resp.status);
        setProgress(resp.progress);
        if (resp.status === 'completed') {
          if (resp.ideal_resume) setIdealResume(resp.ideal_resume);
          if (resp.gap_report) setGapReport(resp.gap_report);
        } else if (resp.status === 'failed') {
          setError(resp.error || '生成失败');
        }
      },
      (err) => setError(err.message),
    );

    return () => {
      stoppedRef.current = true;
      stop();
    };
  }, [sessionId, router]);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {status === 'processing' && (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-lg text-gray-700">
                {PROGRESS_LABELS[progress] || '处理中...'}
              </span>
            </div>
            <div className="flex justify-center gap-8 mt-8">
              {STEPS.map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    progress === step ? 'bg-blue-600 animate-pulse' :
                    STEPS.indexOf(progress) > STEPS.indexOf(step) ? 'bg-green-500' :
                    'bg-gray-300'
                  }`} />
                  <span className="text-xs text-gray-500">{PROGRESS_LABELS[step]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-20">
            <div className="p-6 rounded-lg bg-red-50 border border-red-200 inline-block">
              <p className="text-red-700 mb-4">{error || '生成失败，请重试'}</p>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                返回首页
              </button>
            </div>
          </div>
        )}

        {status === 'completed' && idealResume && gapReport && (
          <IdealResultView idealResume={idealResume} gapReport={gapReport} />
        )}
      </div>
    </main>
  );
}
