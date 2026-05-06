'use client';

import { useState } from 'react';
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
  const [showLlm, setShowLlm] = useState(false);
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">求职阶段</label>
        <select
          value={experienceLevel}
          onChange={(e) => handleExperienceChange(e.target.value as ExperienceLevel)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">目标岗位</label>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => handleRoleInput(e.target.value)}
          placeholder="输入目标岗位，如 AI产品经理"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {QUICK_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => handleTagClick(role)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                activeTag === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">我的履历</label>
        <textarea
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          placeholder={BG_PLACEHOLDER}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">岗位JD</label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder={JD_PLACEHOLDER}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowLlm(!showLlm)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {showLlm ? '收起 LLM 配置' : 'LLM 配置'}
        </button>
        {showLlm && (
          <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs text-gray-600 mb-1">厂商</label>
              <select
                value={llmConfig.provider}
                onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              >
                <option value="deepseek">DeepSeek</option>
                <option value="openai">OpenAI</option>
                <option value="kimi">Kimi</option>
                <option value="glm">GLM</option>
                <option value="claude">Claude</option>
                <option value="qwen">Qwen</option>
                <option value="gemini">Gemini</option>
                <option value="third_party">第三方代理</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">模型</label>
              <input
                type="text"
                value={llmConfig.model}
                onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                value={llmConfig.apiKey}
                onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-3 px-6 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? '生成中...' : '生成简历'}
      </button>
    </form>
  );
}
