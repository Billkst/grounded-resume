'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { ExperienceLevel } from '@/lib/ideal-types';
import type { LLMConfig } from '@/lib/llm-config';
import { DEFAULT_LLM_CONFIG } from '@/lib/llm-config';

const QUICK_ROLES = [
  'AI产品经理',
  '产品经理',
  '后端工程师',
  '前端工程师',
  '算法/机器学习工程师',
  '数据分析师',
  '用户运营',
  'UI/UX设计师',
  '项目经理',
  '管培生',
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'new_grad', label: '实习/应届' },
  { value: '1_3_years', label: '1-3年' },
  { value: '3_5_years', label: '3-5年' },
  { value: '5_10_years', label: '5-10年' },
  { value: '10_plus_years', label: '10年以上' },
];

const BG_PLACEHOLDER = `例如：
- 2023-2027 XX大学 计算机科学 本科
- 用Python做过一个课程项目：电影推荐系统
- 熟悉ChatGPT、Claude等AI工具
- 参加过校内黑客松，做过XX小程序
- 在XX公司做过3个月产品实习生，主要做竞品分析和用户调研
（越详细越好，口语化描述即可）`;

const JD_PLACEHOLDER = '直接粘贴目标岗位的完整JD即可，系统会自动分析';

interface Props {
  onGenerate: (data: {
    experienceLevel: ExperienceLevel;
    targetRole: string;
    background: string;
    jdText: string;
    llmConfig: LLMConfig;
  }) => void;
  loading: boolean;
}

export default function IdealInputForm({ onGenerate, loading }: Props) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('new_grad');
  const [targetRole, setTargetRole] = useState('AI产品经理');
  const [activeTag, setActiveTag] = useState('AI产品经理');
  const [background, setBackground] = useState('');
  const [jdText, setJdText] = useState('');
  const [showLlm, setShowLlm] = useState(true);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);

  const suffix = experienceLevel === 'new_grad' ? '（实习）' : '';

  const handleTagClick = (role: string) => {
    setActiveTag(role);
    setTargetRole(role + (experienceLevel === 'new_grad' ? '（实习）' : ''));
  };

  const handleRoleInput = (value: string) => {
    setTargetRole(value);
    setActiveTag('');
  };

  const handleExperienceChange = (level: ExperienceLevel) => {
    setExperienceLevel(level);
    if (activeTag) {
      setTargetRole(activeTag + (level === 'new_grad' ? '（实习）' : ''));
    } else {
      const cleaned = targetRole.replace('（实习）', '');
      setTargetRole(level === 'new_grad' ? cleaned + '（实习）' : cleaned);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      experienceLevel,
      targetRole: targetRole.replace('（实习）', ''),
      background,
      jdText,
      llmConfig,
    });
  };

  const isValid = targetRole.trim() && jdText.trim() && llmConfig.apiKey;

  const inputBaseClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200`;
  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.85)',
  };
  const inputHoverFocus = `hover:border-white/20 focus:border-white/30 focus:bg-white/[0.06]`;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[560px] mx-auto">
      <div className="space-y-5">
        {/* Experience Level */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-white/70 mb-2">求职阶段</label>
          <select
            value={experienceLevel}
            onChange={(e) => handleExperienceChange(e.target.value as ExperienceLevel)}
            className={`${inputBaseClass} ${inputHoverFocus} appearance-none`}
            style={{
              ...inputStyle,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.3)' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 14px center',
              paddingRight: '36px',
            }}
          >
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#111118] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Target Role */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <label className="block text-sm font-medium text-white/70 mb-2">目标岗位</label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => handleRoleInput(e.target.value)}
            placeholder="输入目标岗位"
            className={`${inputBaseClass} ${inputHoverFocus}`}
            style={inputStyle}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleTagClick(role)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  activeTag === role
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-transparent border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Background */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium text-white/70 mb-2">我的履历</label>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder={BG_PLACEHOLDER}
            rows={5}
            className={`${inputBaseClass} ${inputHoverFocus} resize-y leading-relaxed`}
            style={inputStyle}
          />
        </motion.div>

        {/* JD */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <label className="block text-sm font-medium text-white/70 mb-2">岗位 JD</label>
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={JD_PLACEHOLDER}
            rows={5}
            className={`${inputBaseClass} ${inputHoverFocus} resize-y leading-relaxed`}
            style={inputStyle}
          />
        </motion.div>

        {/* LLM Config */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            type="button"
            onClick={() => setShowLlm(!showLlm)}
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            <span>LLM 配置</span>
            <motion.span
              animate={{ rotate: showLlm ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={14} />
            </motion.span>
          </button>
          {showLlm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-3 p-4 rounded-xl"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div>
                <label className="block text-xs text-white/45 mb-1.5">厂商</label>
                <select
                  value={llmConfig.provider}
                  onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                  className={`${inputBaseClass} ${inputHoverFocus}`}
                  style={inputStyle}
                >
                  <option value="deepseek" className="bg-[#111118]">DeepSeek</option>
                  <option value="openai" className="bg-[#111118]">OpenAI</option>
                  <option value="kimi" className="bg-[#111118]">Kimi</option>
                  <option value="glm" className="bg-[#111118]">GLM</option>
                  <option value="claude" className="bg-[#111118]">Claude</option>
                  <option value="qwen" className="bg-[#111118]">Qwen</option>
                  <option value="gemini" className="bg-[#111118]">Gemini</option>
                  <option value="third_party" className="bg-[#111118]">第三方代理</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/45 mb-1.5">模型</label>
                <input
                  type="text"
                  value={llmConfig.model}
                  onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                  className={`${inputBaseClass} ${inputHoverFocus}`}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs text-white/45 mb-1.5">API Key</label>
                <input
                  type="password"
                  value={llmConfig.apiKey}
                  onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                  className={`${inputBaseClass} ${inputHoverFocus}`}
                  style={inputStyle}
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            type="submit"
            disabled={!isValid || loading}
            whileHover={!loading && isValid ? { scale: 1.01, y: -1 } : {}}
            whileTap={!loading && isValid ? { scale: 0.99 } : {}}
            className="w-full py-3.5 px-6 rounded-xl bg-white text-[#0A0A0F] font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {loading ? '生成中...' : '生成简历'}
          </motion.button>
        </motion.div>
      </div>
    </form>
  );
}
