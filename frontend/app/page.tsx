'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import IdealInputForm from '@/components/ideal-input-form';
import { createGeneration } from '@/lib/ideal-api';
import type { ExperienceLevel } from '@/lib/ideal-types';
import type { LLMConfig } from '@/lib/llm-config';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (data: {
    experienceLevel: ExperienceLevel;
    targetRole: string;
    background: string;
    jdText: string;
    llmConfig: LLMConfig;
  }) => {
    setLoading(true);
    setError('');

    try {
      const resp = await createGeneration({
        experienceLevel: data.experienceLevel,
        targetRole: data.targetRole,
        background: data.background,
        jdText: data.jdText,
        llmConfig: {
          provider: data.llmConfig.provider,
          model: data.llmConfig.model,
          apiKey: data.llmConfig.apiKey,
        },
      });

      router.push(`/result?session=${resp.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          一键生成完美简历
        </h1>
        <p className="text-center text-gray-500 mb-10">
          输入目标岗位JD和你的简要履历，系统自动生成理想版简历和差距分析报告
        </p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <IdealInputForm onGenerate={handleGenerate} loading={loading} />
      </div>
    </main>
  );
}
