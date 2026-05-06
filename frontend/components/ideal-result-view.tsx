'use client';

import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import type { IdealResume, GapReport, TimingInfo } from '@/lib/ideal-types';

const STEP_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
};

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildGapReportMarkdown(report: GapReport): string {
  const lines = [
    '# 差距分析报告',
    '',
    `**综合匹配度：${report.overallScore}%**`,
    '',
    `> ${report.summary}`,
    '',
    '---',
    '',
  ];

  if (report.blockers.length > 0) {
    lines.push('## 致命差距');
    lines.push('');
    for (const b of report.blockers) {
      lines.push(`- **缺什么**：${b.gap}`);
      lines.push(`  - 致命原因：${b.whyFatal}`);
      lines.push(`  - 替代方案：${b.alternative}`);
      lines.push('');
    }
  }

  if (report.criticalGaps.length > 0) {
    lines.push('## 核心差距');
    lines.push('');
    for (const g of report.criticalGaps) {
      lines.push(`- **理想状态**：${g.ideal}`);
      lines.push(`  - **当前状态**：${g.current}`);
      lines.push(`  - **补足路径**：${g.actionPath}`);
      lines.push(`  - **预计时间**：${g.estimatedTime}`);
      lines.push('');
    }
  }

  if (report.expressionTips.length > 0) {
    lines.push('## 表达优化');
    lines.push('');
    for (const t of report.expressionTips) {
      lines.push(`- **原写法**：${t.fromText}`);
      lines.push(`  → **升级为**：${t.toText}`);
      lines.push(`  → **方法**：${t.method}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

interface Props {
  idealResume: IdealResume;
  gapReport: GapReport;
  timing?: TimingInfo | null;
}

function formatSeconds(s: number): string {
  if (s >= 60) {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return sec > 0 ? `${m}分${sec}秒` : `${m}分`;
  }
  return `${Math.round(s)}秒`;
}

export default function IdealResultView({ idealResume, gapReport, timing }: Props) {
  return (
    <div className="space-y-8">
      {/* Timing */}
      {timing && (
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-4 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-white/60">生成耗时</span>
            <span className="text-lg font-bold text-white">{formatSeconds(timing.totalSeconds)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/35">
            {Object.entries(timing.steps).map(([step, sec]) => (
              <span key={step}>
                {STEP_LABELS[step] || step}：{formatSeconds(sec)}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Ideal Resume */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">理想版简历</h2>
          <button
            onClick={() => downloadMarkdown(idealResume.markdown, '理想版简历.md')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#0A0A0F] text-sm font-medium hover:bg-white/90 transition-colors"
          >
            <Download size={14} />
            导出 Markdown
          </button>
        </div>

        <div
          className="p-4 rounded-lg mb-4 text-xs font-medium"
          style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.15)', color: 'rgba(234, 179, 8, 0.8)' }}
        >
          该简历为理想目标画像，代表{'“'}该岗位理论上的完美候选人{'”'}，非您当前可投递版本。请参照下方差距报告了解您与目标的差距。
        </div>

        <div
          className="p-6 rounded-xl"
          style={{ background: '#111118', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
            {idealResume.markdown}
          </pre>
        </div>
      </motion.section>

      {/* Gap Report */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">差距分析报告</h2>
          <button
            onClick={() => downloadMarkdown(buildGapReportMarkdown(gapReport), '差距分析报告.md')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)' }}
          >
            <Download size={14} />
            导出差距报告
          </button>
        </div>

        <div
          className="p-5 rounded-xl mb-6"
          style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{gapReport.overallScore}%</span>
            <span className="text-sm text-white/40">综合匹配度</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{gapReport.summary}</p>
        </div>

        {gapReport.blockers.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              致命差距
            </h3>
            <div className="space-y-3">
              {gapReport.blockers.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.12)' }}
                >
                  <p className="text-sm font-medium text-red-300/90 mb-1.5">缺什么：{b.gap}</p>
                  <p className="text-sm text-red-300/70 mb-1">致命原因：{b.whyFatal}</p>
                  <p className="text-sm text-red-300/60">替代方案：{b.alternative}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {gapReport.criticalGaps.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              核心差距
            </h3>
            <div className="space-y-3">
              {gapReport.criticalGaps.map((g, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.12)' }}
                >
                  <p className="text-sm font-medium text-amber-300/90 mb-1">理想状态：{g.ideal}</p>
                  <p className="text-sm text-amber-300/70 mb-1">当前状态：{g.current}</p>
                  <p className="text-sm text-amber-300/70 mb-1">补足路径：{g.actionPath}</p>
                  <p className="text-xs text-amber-300/50">预计时间：{g.estimatedTime}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {gapReport.expressionTips.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              表达优化
            </h3>
            <div className="space-y-2">
              {gapReport.expressionTips.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3.5 rounded-xl"
                  style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.12)' }}
                >
                  <p className="text-sm text-emerald-300/80">
                    <span className="line-through text-emerald-300/40">{t.fromText}</span>
                    {' → '}
                    <span className="font-medium text-emerald-300">{t.toText}</span>
                  </p>
                  <p className="text-xs text-emerald-300/50 mt-1">方法：{t.method}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
