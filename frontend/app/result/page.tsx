'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pollGeneration } from '@/lib/ideal-api';
import type { IdealResume, GapReport, GenerateResponse, TimingInfo } from '@/lib/ideal-types';
import FluidBackground from '@/components/fluid-background';
import DotMatrix from '@/components/dot-matrix';
import IdealResultView from '@/components/ideal-result-view';

const PROGRESS_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
  done: '完成',
};

const STEPS = ['job_profile', 'generating_resume', 'analyzing_gaps', 'done'];

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen">
        <FluidBackground />
        <DotMatrix />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="inline-flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/60">加载中...</span>
          </div>
        </div>
      </div>
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
  const [timing, setTiming] = useState<TimingInfo | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const stoppedRef = useRef(false);

  // Elapsed time ticker
  useEffect(() => {
    if (status !== 'processing') return;
    const ticker = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(ticker);
  }, [status]);

  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }

    stoppedRef.current = false;

    const stop = pollGeneration(
      sessionId,
      (resp: GenerateResponse) => {
        if (stoppedRef.current) return;
        const s = (resp.status || '').toLowerCase();
        setStatus(resp.status);
        setProgress(resp.progress);
        if (['completed', 'done', 'success'].includes(s)) {
          if (resp.ideal_resume) setIdealResume(resp.ideal_resume);
          if (resp.gap_report) setGapReport(resp.gap_report);
          if (resp.timing) setTiming(resp.timing);
        } else if (['failed', 'error'].includes(s)) {
          setError(resp.error || '生成失败');
        }
      },
      (err) => {
        setStatus('failed');
        setError(`网络错误: ${err.message}`);
      },
    );

    return () => {
      stoppedRef.current = true;
      stop();
    };
  }, [sessionId, router]);

  return (
    <div className="relative min-h-screen">
      <FluidBackground />
      <DotMatrix />

      <div className="relative z-10">
        {/* Score Hero */}
        <div
          className="relative overflow-hidden px-6 py-10"
          style={{
            background: 'linear-gradient(180deg, rgba(10,10,15,0.8) 0%, rgba(10,10,15,0.4) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="max-w-[1000px] mx-auto flex items-center gap-6">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <ArrowLeft size={16} />
              返回
            </button>

            {status === 'completed' && gapReport && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-6 flex-1"
              >
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-white tracking-tighter">
                    {gapReport.overallScore}<span className="text-2xl text-white/30">%</span>
                  </div>
                  <div className="text-[11px] text-white/40 uppercase tracking-wider mt-1">匹配度</div>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold text-white">AI产品经理 · 实习/应届</div>
                  {timing && (
                    <div className="text-xs text-white/40 mt-1">
                      生成耗时 {formatElapsed(Math.round(timing.totalSeconds))}
                    </div>
                  )}
                  <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-lg">
                    {gapReport.summary}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1000px] mx-auto px-6 py-8">
          {status === 'processing' && (
            <div className="text-center py-24">
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-8 p-4 rounded-xl inline-block"
                  style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
                >
                  <p className="text-sm text-red-300">{error}</p>
                </motion.div>
              )}

              <div className="inline-flex items-center gap-3 mb-8">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="text-white/70">
                  {PROGRESS_LABELS[progress] || '处理中...'}
                </span>
              </div>

              <p className="text-sm text-white/30 mb-10">
                已耗时 {formatElapsed(elapsed)}
              </p>

              <div className="flex justify-center gap-6">
                {STEPS.map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-500 ${
                        progress === step ? 'bg-white animate-pulse' :
                        STEPS.indexOf(progress) > STEPS.indexOf(step) ? 'bg-white/60' :
                        'bg-white/15'
                      }`}
                    />
                    <span className="text-xs text-white/40">{PROGRESS_LABELS[step]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-24">
              <div
                className="p-6 rounded-xl inline-block"
                style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.12)' }}
              >
                <p className="text-red-300 mb-4">{error || '生成失败，请重试'}</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-5 py-2.5 rounded-lg bg-white text-[#0A0A0F] text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  返回首页
                </button>
              </div>
            </div>
          )}

          {status === 'completed' && idealResume && gapReport && (
            <IdealResultView idealResume={idealResume} gapReport={gapReport} timing={timing} />
          )}
        </div>
      </div>
    </div>
  );
}
