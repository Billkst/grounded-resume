# 前端界面重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 grounded-resume 前端从浅色表单原型升级为 stitch.withgoogle.com 风格的暗黑模式界面：动态流体极光背景、毛玻璃质感、Framer Motion 动画。

**Architecture:** 纯前端 UI 重设计，不改动后端 API 或业务逻辑。新增可复用的视觉组件（FluidBackground、DotMatrix、Navbar、GlassCard），重写页面布局和表单/结果展示组件。使用 Framer Motion 处理入场和滚动动画。

**Tech Stack:** Next.js 14 App Router + Tailwind CSS + Framer Motion + Lucide React

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `frontend/package.json` | 修改 | 新增 `framer-motion`、`lucide-react` 依赖 |
| `frontend/tailwind.config.ts` | 修改 | 删除旧法医主题颜色，添加暗黑模式动画 keyframes |
| `frontend/app/globals.css` | 重写 | 暗黑模式基础样式、流体背景动画、点阵遮罩 |
| `frontend/app/layout.tsx` | 修改 | 更新 metadata、字体栈 |
| `frontend/components/fluid-background.tsx` | 创建 | 动态流体极光背景（多个模糊色块 CSS 动画） |
| `frontend/components/dot-matrix.tsx` | 创建 | 点阵/噪点遮罩层 |
| `frontend/components/navbar.tsx` | 创建 | sticky 导航栏（毛玻璃背景 + Logo + CTA 按钮） |
| `frontend/components/glass-card.tsx` | 创建 | 可复用的毛玻璃卡片容器 |
| `frontend/components/ideal-input-form.tsx` | 重写 | 暗黑模式下的输入表单（保留所有字段和逻辑） |
| `frontend/components/ideal-result-view.tsx` | 重写 | 双栏布局结果展示（简历 + 差距报告） |
| `frontend/app/page.tsx` | 重写 | 首页：Navbar + Hero + 表单 + Features 简介 |
| `frontend/app/result/page.tsx` | 重写 | 结果页：评分 Hero + 双栏内容区 |
| `frontend/e2e/ideal-generator.spec.ts` | 修改 | 更新选择器以匹配新 DOM 结构 |
| `frontend/e2e/home-validation.spec.ts` | 删除 | 已过时（测试旧版简历生成器字段） |
| `frontend/e2e/resume-flow.spec.ts` | 删除 | 已过时（测试旧版 /sessions API 和 /confirmation 页面） |
| `frontend/e2e/responsive.spec.ts` | 删除 | 已过时（引用旧版页面结构） |
| `frontend/e2e/error-states.spec.ts` | 删除 | 已过时（测试旧版错误状态） |
| `frontend/e2e/real-end-to-end.spec.ts` | 修改 | 更新为新版路径和选择器 |

---

## Task 1: 安装依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 安装 framer-motion 和 lucide-react**

Run:
```bash
cd /home/liujunxi/CodeSpace/grounded-resume/frontend && npm install framer-motion lucide-react
```
Expected: 安装成功，无报错。

- [ ] **Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "deps: add framer-motion and lucide-react"
```

---

## Task 2: 重写全局样式

**Files:**
- Rewrite: `frontend/app/globals.css`

- [ ] **Step 1: 写入新的 globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #0A0A0F;
  --foreground: #ffffff;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Fluid background animations */
@keyframes drift-1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(40px, -30px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

@keyframes drift-2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(-30px, 25px) scale(0.95); }
  66% { transform: translate(25px, -15px) scale(1.05); }
}

@keyframes drift-3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, 30px) scale(1.05); }
  66% { transform: translate(-35px, -20px) scale(0.95); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.7; }
}

/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Selection color */
::selection {
  background: rgba(99, 102, 241, 0.3);
  color: #ffffff;
}
```

- [ ] **Step 2: 构建验证**

Run:
```bash
cd /home/liujunxi/CodeSpace/grounded-resume/frontend && npm run build
```
Expected: build 成功。

- [ ] **Step 3: Commit**

```bash
git add frontend/app/globals.css
git commit -m "style: rewrite globals.css for dark theme with fluid animations"
```

---

## Task 3: 更新 Tailwind 配置

**Files:**
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: 替换 tailwind.config.ts 内容**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0F',
          card: '#111118',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      animation: {
        'drift-1': 'drift-1 20s ease-in-out infinite',
        'drift-2': 'drift-2 25s ease-in-out infinite',
        'drift-3': 'drift-3 18s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 8s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'SF Pro Display', 'Segoe UI', 'Roboto', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 2: Commit**

```bash
git add frontend/tailwind.config.ts
git commit -m "config: update tailwind for dark theme and custom animations"
```

---

## Task 4: 更新 Layout

**Files:**
- Modify: `frontend/app/layout.tsx`

- [ ] **Step 1: 替换 layout.tsx**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grounded Resume — 发现你的理想简历',
  description: '输入目标岗位 JD，AI 分析差距、生成理想简历与路线图',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0A0A0F] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/layout.tsx
git commit -m "feat: update layout with dark theme metadata"
```

---

## Task 5: 创建 FluidBackground 组件

**Files:**
- Create: `frontend/components/fluid-background.tsx`

- [ ] **Step 1: 写入组件代码**

```typescript
'use client'

export default function FluidBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base dark background */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full animate-drift-1"
        style={{
          background: 'radial-gradient(circle, rgba(76, 29, 149, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '-10%',
          left: '-5%',
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full animate-drift-2"
        style={{
          background: 'radial-gradient(circle, rgba(190, 24, 93, 0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '40%',
          right: '-10%',
        }}
      />
      <div 
        className="absolute w-[450px] h-[450px] rounded-full animate-drift-3"
        style={{
          background: 'radial-gradient(circle, rgba(14, 116, 144, 0.12) 0%, transparent 70%)',
          filter: 'blur(80px)',
          bottom: '-10%',
          left: '30%',
        }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full animate-drift-1"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          top: '20%',
          left: '60%',
          animationDelay: '-5s',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/fluid-background.tsx
git commit -m "feat: add FluidBackground component with animated gradient orbs"
```

---

## Task 6: 创建 DotMatrix 组件

**Files:**
- Create: `frontend/components/dot-matrix.tsx`

- [ ] **Step 1: 写入组件代码**

```typescript
'use client'

export default function DotMatrix() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        opacity: 0.3,
      }}
    />
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/dot-matrix.tsx
git commit -m "feat: add DotMatrix overlay component"
```

---

## Task 7: 创建 Navbar 组件

**Files:**
- Create: `frontend/components/navbar.tsx`

- [ ] **Step 1: 写入组件代码**

```typescript
'use client'

import { motion } from 'framer-motion'

export default function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 h-16 flex items-center justify-between px-6 lg:px-10"
      style={{
        background: 'rgba(10, 10, 15, 0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      <div className="text-lg font-bold tracking-tight text-white">
        Grounded Resume
      </div>
      <motion.button
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="px-5 py-2 bg-white text-[#0A0A0F] text-sm font-semibold rounded-lg transition-colors hover:bg-white/90"
      >
        开始使用
      </motion.button>
    </motion.nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/navbar.tsx
git commit -m "feat: add Navbar component with glassmorphism and framer motion"
```

---

## Task 8: 创建 GlassCard 组件

**Files:**
- Create: `frontend/components/glass-card.tsx`

- [ ] **Step 1: 写入组件代码**

```typescript
'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function GlassCard({ children, className = '', delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Top glow line */}
      <div 
        className="absolute top-0 left-6 right-6 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
        }}
      />
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/glass-card.tsx
git commit -m "feat: add GlassCard reusable component with top glow line"
```

---

## Task 9: 重写 IdealInputForm

**Files:**
- Rewrite: `frontend/components/ideal-input-form.tsx`

- [ ] **Step 1: 写入完整表单组件**

```typescript
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Sparkles } from 'lucide-react'
import type { ExperienceLevel } from '@/lib/ideal-types'
import type { LLMConfig } from '@/lib/llm-config'
import { DEFAULT_LLM_CONFIG } from '@/lib/llm-config'

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
]

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'new_grad', label: '实习/应届' },
  { value: '1_3_years', label: '1-3年' },
  { value: '3_5_years', label: '3-5年' },
  { value: '5_10_years', label: '5-10年' },
  { value: '10_plus_years', label: '10年以上' },
]

const BG_PLACEHOLDER = `例如：
- 2023-2027 XX大学 计算机科学 本科
- 用Python做过一个课程项目：电影推荐系统
- 熟悉ChatGPT、Claude等AI工具
- 参加过校内黑客松，做过XX小程序
- 在XX公司做过3个月产品实习生，主要做竞品分析和用户调研
（越详细越好，口语化描述即可）`

const JD_PLACEHOLDER = '直接粘贴目标岗位的完整JD即可，系统会自动分析'

interface Props {
  onGenerate: (data: {
    experienceLevel: ExperienceLevel
    targetRole: string
    background: string
    jdText: string
    llmConfig: LLMConfig
  }) => void
  loading: boolean
}

export default function IdealInputForm({ onGenerate, loading }: Props) {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('new_grad')
  const [targetRole, setTargetRole] = useState('AI产品经理')
  const [activeTag, setActiveTag] = useState('AI产品经理')
  const [background, setBackground] = useState('')
  const [jdText, setJdText] = useState('')
  const [showLlm, setShowLlm] = useState(true)
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG)

  const suffix = experienceLevel === 'new_grad' ? '（实习）' : ''

  const handleTagClick = (role: string) => {
    setActiveTag(role)
    setTargetRole(role + (experienceLevel === 'new_grad' ? '（实习）' : ''))
  }

  const handleRoleInput = (value: string) => {
    setTargetRole(value)
    setActiveTag('')
  }

  const handleExperienceChange = (level: ExperienceLevel) => {
    setExperienceLevel(level)
    if (activeTag) {
      setTargetRole(activeTag + (level === 'new_grad' ? '（实习）' : ''))
    } else {
      const cleaned = targetRole.replace('（实习）', '')
      setTargetRole(level === 'new_grad' ? cleaned + '（实习）' : cleaned)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate({
      experienceLevel,
      targetRole: targetRole.replace('（实习）', ''),
      background,
      jdText,
      llmConfig,
    })
  }

  const isValid = targetRole.trim() && jdText.trim() && llmConfig.apiKey

  const inputBaseClass = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-200`
  const inputStyle = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.85)',
  }
  const inputHoverFocus = `hover:border-white/20 focus:border-white/30 focus:bg-white/[0.06]`

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
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/ideal-input-form.tsx
git commit -m "feat: redesign IdealInputForm with dark glassmorphism theme"
```

---

## Task 10: 重写首页 page.tsx

**Files:**
- Rewrite: `frontend/app/page.tsx`

- [ ] **Step 1: 写入完整首页**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '@/components/navbar'
import FluidBackground from '@/components/fluid-background'
import DotMatrix from '@/components/dot-matrix'
import GlassCard from '@/components/glass-card'
import IdealInputForm from '@/components/ideal-input-form'
import { createGeneration } from '@/lib/ideal-api'
import type { ExperienceLevel } from '@/lib/ideal-types'
import type { LLMConfig } from '@/lib/llm-config'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async (data: {
    experienceLevel: ExperienceLevel
    targetRole: string
    background: string
    jdText: string
    llmConfig: LLMConfig
  }) => {
    setLoading(true)
    setError('')

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
      })

      router.push(`/result?session=${resp.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <FluidBackground />
      <DotMatrix />
      
      <div className="relative z-10">
        <Navbar />
        
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
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: redesign homepage with dark theme, fluid bg, and glassmorphism"
```

---

## Task 11: 重写 IdealResultView

**Files:**
- Rewrite: `frontend/components/ideal-result-view.tsx`

- [ ] **Step 1: 写入完整结果展示组件**

```typescript
'use client'

import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import type { IdealResume, GapReport, TimingInfo } from '@/lib/ideal-types'

const STEP_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
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
  ]

  if (report.blockers.length > 0) {
    lines.push('## 致命差距')
    lines.push('')
    for (const b of report.blockers) {
      lines.push(`- **缺什么**：${b.gap}`)
      lines.push(`  - 致命原因：${b.whyFatal}`)
      lines.push(`  - 替代方案：${b.alternative}`)
      lines.push('')
    }
  }

  if (report.criticalGaps.length > 0) {
    lines.push('## 核心差距')
    lines.push('')
    for (const g of report.criticalGaps) {
      lines.push(`- **理想状态**：${g.ideal}`)
      lines.push(`  - **当前状态**：${g.current}`)
      lines.push(`  - **补足路径**：${g.actionPath}`)
      lines.push(`  - **预计时间**：${g.estimatedTime}`)
      lines.push('')
    }
  }

  if (report.expressionTips.length > 0) {
    lines.push('## 表达优化')
    lines.push('')
    for (const t of report.expressionTips) {
      lines.push(`- **原写法**：${t.fromText}`)
      lines.push(`  → **升级为**：${t.toText}`)
      lines.push(`  → **方法**：${t.method}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

interface Props {
  idealResume: IdealResume
  gapReport: GapReport
  timing?: TimingInfo | null
}

function formatSeconds(s: number): string {
  if (s >= 60) {
    const m = Math.floor(s / 60)
    const sec = Math.round(s % 60)
    return sec > 0 ? `${m}分${sec}秒` : `${m}分`
  }
  return `${Math.round(s)}秒`
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
          该简历为理想目标画像，代表"该岗位理论上的完美候选人"，非您当前可投递版本。请参照下方差距报告了解您与目标的差距。
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
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/ideal-result-view.tsx
git commit -m "feat: redesign IdealResultView with dark theme and staggered animations"
```

---

## Task 12: 重写结果页

**Files:**
- Rewrite: `frontend/app/result/page.tsx`

- [ ] **Step 1: 写入完整结果页**

```typescript
'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Download } from 'lucide-react'
import { pollGeneration } from '@/lib/ideal-api'
import type { IdealResume, GapReport, GenerateResponse, TimingInfo } from '@/lib/ideal-types'
import FluidBackground from '@/components/fluid-background'
import DotMatrix from '@/components/dot-matrix'
import IdealResultView from '@/components/ideal-result-view'

const PROGRESS_LABELS: Record<string, string> = {
  job_profile: '分析岗位需求',
  generating_resume: '生成理想简历',
  analyzing_gaps: '分析差距',
  done: '完成',
}

const STEPS = ['job_profile', 'generating_resume', 'analyzing_gaps', 'done']

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
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
  )
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session')
  const [status, setStatus] = useState<string>('processing')
  const [progress, setProgress] = useState('')
  const [idealResume, setIdealResume] = useState<IdealResume | null>(null)
  const [gapReport, setGapReport] = useState<GapReport | null>(null)
  const [timing, setTiming] = useState<TimingInfo | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (status !== 'processing') return
    const ticker = setInterval(() => setElapsed((n) => n + 1), 1000)
    return () => clearInterval(ticker)
  }, [status])

  useEffect(() => {
    if (!sessionId) {
      router.replace('/')
      return
    }

    stoppedRef.current = false

    const stop = pollGeneration(
      sessionId,
      (resp: GenerateResponse) => {
        if (stoppedRef.current) return
        const s = (resp.status || '').toLowerCase()
        setStatus(resp.status)
        setProgress(resp.progress)
        if (['completed', 'done', 'success'].includes(s)) {
          if (resp.ideal_resume) setIdealResume(resp.ideal_resume)
          if (resp.gap_report) setGapReport(resp.gap_report)
          if (resp.timing) setTiming(resp.timing)
        } else if (['failed', 'error'].includes(s)) {
          setError(resp.error || '生成失败')
        }
      },
      (err) => {
        setStatus('failed')
        setError(`网络错误: ${err.message}`)
      },
    )

    return () => {
      stoppedRef.current = true
      stop()
    }
  }, [sessionId, router])

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
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/result/page.tsx
git commit -m "feat: redesign result page with score hero and dark theme"
```

---

## Task 13: 构建验证

**Files:**
- None (验证步骤)

- [ ] **Step 1: 运行前端构建**

Run:
```bash
cd /home/liujunxi/CodeSpace/grounded-resume/frontend && npm run build
```
Expected: `Build completed successfully`，无 TypeScript 或 ESLint 错误。

- [ ] **Step 2: 如果有错误则修复**

根据错误信息修复类型或导入问题，重新构建直到成功。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "build: verify frontend build passes after redesign"
```

---

## Task 14: 更新并清理 E2E 测试

**Files:**
- Modify: `frontend/e2e/ideal-generator.spec.ts`
- Modify: `frontend/e2e/real-end-to-end.spec.ts`
- Delete: `frontend/e2e/home-validation.spec.ts`
- Delete: `frontend/e2e/resume-flow.spec.ts`
- Delete: `frontend/e2e/responsive.spec.ts`
- Delete: `frontend/e2e/error-states.spec.ts`

- [ ] **Step 1: 更新 ideal-generator.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

test('ideal generator input page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('发现你的理想简历');
  await expect(page.locator('select')).toBeVisible();
  await expect(page.locator('input[type="text"]').first()).toBeVisible();
  await expect(page.getByText('AI产品经理')).toBeVisible();
});

test('quick role tags fill input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '后端工程师' }).click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('后端工程师（实习）');
});

test('experience level changes suffix', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'AI产品经理' }).click();
  const input = page.locator('input[type="text"]').first();
  await expect(input).toHaveValue('AI产品经理（实习）');
  await page.selectOption('select', '1_3_years');
  await expect(input).toHaveValue('AI产品经理');
});

test('generate button disabled without API key', async ({ page }) => {
  await page.goto('/');
  await page.locator('textarea').first().fill('test background');
  await page.locator('textarea').last().fill('test JD');
  const btn = page.getByRole('button', { name: '生成简历' });
  await expect(btn).toBeDisabled();
});
```

- [ ] **Step 2: 更新 real-end-to-end.spec.ts**

```typescript
import { test, expect } from '@playwright/test';

test.setTimeout(300_000);

test('real end-to-end ideal resume generation with DeepSeek', async ({ page }) => {
  await page.goto('/');
  
  // Fill form
  await page.selectOption('select', 'new_grad');
  await page.getByRole('button', { name: 'AI产品经理' }).click();
  await page.locator('textarea').first().fill('计算机科学本科，有产品实习经验');
  await page.locator('textarea').last().fill('负责AI产品需求分析和设计，要求计算机相关专业，有实习经验优先');
  
  // Fill API key in LLM config
  await page.locator('input[type="password"]').fill('sk-test-api-key');
  
  // Submit
  await page.getByRole('button', { name: '生成简历' }).click();
  
  // Wait for result page
  await page.waitForURL(/\/result\?session=/, { timeout: 30000 });
  
  // Wait for completion
  await expect(page.getByText('理想版简历')).toBeVisible({ timeout: 240_000 });
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/real-end-to-end-result.png', fullPage: true });
});
```

- [ ] **Step 3: 删除过时的旧版 E2E 测试**

```bash
rm /home/liujunxi/CodeSpace/grounded-resume/frontend/e2e/home-validation.spec.ts
rm /home/liujunxi/CodeSpace/grounded-resume/frontend/e2e/resume-flow.spec.ts
rm /home/liujunxi/CodeSpace/grounded-resume/frontend/e2e/responsive.spec.ts
rm /home/liujunxi/CodeSpace/grounded-resume/frontend/e2e/error-states.spec.ts
```

- [ ] **Step 4: 运行 E2E 测试**

Run:
```bash
cd /home/liujunxi/CodeSpace/grounded-resume/frontend && npx playwright test e2e/ideal-generator.spec.ts
```
Expected: 所有 4 个测试通过。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: update E2E tests for new dark theme UI"
```

---

## Self-Review

**1. Spec coverage:**
- 动态流体背景 → Task 5 (FluidBackground)
- 点阵遮罩 → Task 6 (DotMatrix)
- Navbar 毛玻璃 → Task 7 (Navbar)
- 毛玻璃表单卡片 → Task 8 (IdealInputForm) + Task 9 (GlassCard)
- 首页 Hero + Features → Task 10 (page.tsx)
- 结果页评分 Hero + 双栏 → Task 12 (result/page.tsx) + Task 11 (IdealResultView)
- Framer Motion 动画 → 各组件中均有实现
- 暗黑模式配色 → Task 2 (globals.css) + Task 3 (tailwind.config.ts)
- 无遗漏。

**2. Placeholder scan:**
- 无 TBD/TODO/"implement later"
- 所有代码块完整
- 所有命令具体

**3. Type consistency:**
- `ExperienceLevel`、`LLMConfig`、`GenerateRequest`、`IdealResume`、`GapReport`、`TimingInfo` 类型均来自现有 `ideal-types.ts` 和 `llm-config.ts`，与现有 API 一致。
- `createGeneration` 和 `pollGeneration` 的调用方式与现有 API 一致。

**4. E2E 适配：**
- 旧版 E2E 测试（基于 /sessions API 和旧表单字段）已标记删除
- 新版 `ideal-generator.spec.ts` 已更新 h1 文字匹配
- `real-end-to-end.spec.ts` 已适配新版表单路径
