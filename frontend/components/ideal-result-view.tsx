'use client';

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
    lines.push('## 🔴 致命差距');
    lines.push('');
    for (const b of report.blockers) {
      lines.push(`- **缺什么**：${b.gap}`);
      lines.push(`  - 致命原因：${b.whyFatal}`);
      lines.push(`  - 替代方案：${b.alternative}`);
      lines.push('');
    }
  }

  if (report.criticalGaps.length > 0) {
    lines.push('## 🟡 核心差距');
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
    lines.push('## 🟢 表达优化');
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
    <div className="space-y-10">
      {timing && (
        <section>
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">生成耗时</span>
              <span className="text-lg font-bold text-gray-900">{formatSeconds(timing.totalSeconds)}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              {Object.entries(timing.steps).map(([step, sec]) => (
                <span key={step}>
                  {STEP_LABELS[step] || step}：{formatSeconds(sec)}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">理想版简历</h2>
          <button
            onClick={() => downloadMarkdown(idealResume.markdown, '理想版简历.md')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
          >
            导出 Markdown
          </button>
        </div>

        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-4">
          ⚠️ 该简历为理想目标画像，代表"该岗位理论上的完美候选人"，非您当前可投递版本。请参照下方差距报告了解您与目标的差距。
        </div>

        <div className="p-6 rounded-lg border border-gray-200 bg-white">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800">
            {idealResume.markdown}
          </pre>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">差距分析报告</h2>
          <button
            onClick={() => downloadMarkdown(buildGapReportMarkdown(gapReport), '差距分析报告.md')}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition"
          >
            导出差距报告
          </button>
        </div>

        <div className="p-6 rounded-lg bg-gray-50 border border-gray-200 mb-6">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl font-bold text-gray-900">{gapReport.overallScore}%</span>
            <span className="text-sm text-gray-500">综合匹配度</span>
          </div>
          <p className="text-sm text-gray-700">{gapReport.summary}</p>
        </div>

        {gapReport.blockers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3">🔴 致命差距</h3>
            <div className="space-y-3">
              {gapReport.blockers.map((b, i) => (
                <div key={i} className="p-4 rounded-lg border border-red-200 bg-red-50">
                  <p className="text-sm font-medium text-red-800 mb-2">缺什么：{b.gap}</p>
                  <p className="text-sm text-red-700 mb-1">致命原因：{b.whyFatal}</p>
                  <p className="text-sm text-red-600">替代方案：{b.alternative}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {gapReport.criticalGaps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-amber-700 mb-3">🟡 核心差距</h3>
            <div className="space-y-3">
              {gapReport.criticalGaps.map((g, i) => (
                <div key={i} className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                  <p className="text-sm font-medium text-amber-800 mb-2">理想状态：{g.ideal}</p>
                  <p className="text-sm text-amber-700 mb-1">当前状态：{g.current}</p>
                  <p className="text-sm text-amber-700 mb-1">补足路径：{g.actionPath}</p>
                  <p className="text-xs text-amber-600">预计时间：{g.estimatedTime}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {gapReport.expressionTips.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-green-700 mb-3">🟢 表达优化</h3>
            <div className="space-y-2">
              {gapReport.expressionTips.map((t, i) => (
                <div key={i} className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <p className="text-sm text-green-800">
                    <span className="line-through text-green-600">{t.fromText}</span>
                    {' → '}
                    <span className="font-medium">{t.toText}</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">方法：{t.method}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
