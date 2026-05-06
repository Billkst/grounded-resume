'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/navbar';
import FluidBackground from '@/components/fluid-background';
import DotMatrix from '@/components/dot-matrix';
import GlassCard from '@/components/glass-card';
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
    <div className="relative min-h-screen">
      <div className="relative z-10">

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center px-6 pt-16 pb-8">
          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            发现你的<span className="text-white/50">理想简历</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 text-base text-white/45 max-w-md leading-relaxed"
          >
            输入目标岗位 JD 与背景，AI 分析差距、生成路线图
          </motion.p>
        </section>

        {/* Form Section */}
        <section className="px-6 pb-12">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[560px] mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          <GlassCard className="max-w-[560px] mx-auto p-6 md:p-8" delay={0.2}>
            <IdealInputForm onGenerate={handleGenerate} loading={loading} />
          </GlassCard>
        </section>

        {/* Features Section */}
        <section className="px-6 pb-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            className="max-w-[720px] mx-auto"
          >
            <div className="text-center mb-10">
              <div className="text-xs font-semibold text-white/30 uppercase tracking-[2px] mb-3">
                How It Works
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                三步，看清你与目标的差距
              </h2>
              <p className="text-sm text-white/40">
                不只是生成简历，而是给你一张从现状到目标的路线图
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: '01', title: '岗位画像', desc: '深度解析 JD，提取硬性要求、核心能力与 ATS 关键词' },
                { step: '02', title: '理想简历', desc: '基于岗位画像反推完美候选人的简历结构与表达' },
                { step: '03', title: '差距分析', desc: '三层差距报告 + 匹配度评分，附具体补足路径' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.step}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)' }}
                  className="p-6 rounded-xl transition-colors duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="text-[11px] font-semibold text-white/30 uppercase tracking-[1.5px] mb-3">
                    Step {feature.step}
                  </div>
                  <div className="text-[15px] font-semibold text-white/90 mb-2">
                    {feature.title}
                  </div>
                  <div className="text-xs text-white/40 leading-relaxed">
                    {feature.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
