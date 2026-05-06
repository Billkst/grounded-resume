# 前端界面重设计 — Design Spec

## 设计目标

将 grounded-resume 前端从目前的"浅色表单原型"升级为具有高级科技感的暗黑模式界面，视觉风格参考 stitch.withgoogle.com：动态流体极光背景、毛玻璃质感、精致的微交互。

保留产品核心功能不变：首页输入表单 → 结果页展示理想简历 + 差距分析报告。

## 全局设计风格

### 色彩模式
纯暗黑模式。背景 `#0A0A0F`，卡片 `#111118`，文字层级：主标题 `#fff`、正文 `rgba(255,255,255,0.7)`、辅助 `rgba(255,255,255,0.4)`。

强调色：纯白 `#fff`（用于主按钮和关键文字），无其他高饱和彩色。

### 核心动态背景

**流体极光渐变（Fluid Mesh Gradient）**
- 底层使用多个 `position: absolute` 的模糊色块（`filter: blur(100px)`），颜色为深紫 `#4C1D95`、品红 `#BE185D`、湖蓝 `#0E7490` 的极低透明度版本。
- 每个色块使用 CSS `@keyframes` 缓慢漂移（20-30s 周期），scale 轻微变化，形成液体流动感。

**点阵/噪点遮罩（Dot Matrix Overlay）**
- 覆盖在渐变层之上的 `pointer-events: none` 层。
- 使用 `radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)` 形成网格。
- `background-size: 24px 24px`，整体透明度 0.3。

### 排版与字体
- 主字体栈：`-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif`
- 标题：粗体、负字间距（`letter-spacing: -0.02em`）
- 正文：14px，行高 1.6

## 页面一：首页（Home）

### 顶部导航栏（Sticky Navbar）
- `sticky top-0 z-50`
- 高度 64px，背景 `rgba(10,10,15,0.7)` + `backdrop-blur(12px)`
- 左侧：Logo 文字 "Grounded Resume"
- 右侧：白底黑字按钮 "开始使用"，圆角 8px，hover 时 `scale(1.02)` + `translateY(-1px)`
- 底部边框：`1px solid rgba(255,255,255,0.06)`

### Hero Section
- 垂直居中，上下大留白（padding-top: 120px, padding-bottom: 80px）
- H1："发现你的理想简历"，40px / font-weight: 800 / color: #fff
- 副标题："输入目标岗位 JD 与背景，AI 分析差距、生成路线图"，15px / color: rgba(255,255,255,0.45)

### 核心组件：毛玻璃输入表单
- 定位：Hero 正中央下方
- 样式：
  - 背景 `rgba(255,255,255,0.03)`
  - `backdrop-filter: blur(20px)`
  - 边框：`1px solid rgba(255,255,255,0.08)`
  - 顶部发光细线：`linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)`
  - 圆角 16px，padding 32px
  - 最大宽度 560px，居中
- 字段顺序（参考旧版）：
  1. 求职阶段（select）
  2. 目标岗位（input + 快速选择标签行）
  3. 我的履历（textarea）
  4. 岗位 JD（textarea）
  5. LLM 配置（可折叠面板，默认展开）
  6. 生成按钮
- 输入框样式：
  - 背景 `rgba(255,255,255,0.04)`
  - 边框 `1px solid rgba(255,255,255,0.1)`
  - focus 状态：边框亮度提升 + 背景微亮
  - 文字颜色 `rgba(255,255,255,0.85)`
- 快速标签：
  - 默认状态：透明底 + 细边框 + 灰色文字
  - 选中状态：`rgba(255,255,255,0.1)` 底 + 白色文字 + 边框亮度提升
- 生成按钮：
  - 纯白底 `#fff` + 黑色文字 `#0A0A0F`
  - hover：`scale(1.01)` + 背景微暗

### Features 简介区（可选，简洁版本）
- 位于表单下方，三列等宽卡片
- 背景与页面融为一体（无边框或极淡边框）
- Step 01/02/03 标签 + 标题 + 描述

## 页面二：结果页（Result）

### 顶部评分区（Dark Hero）
- 高度约 200px，延续首页流体背景
- 左侧：大数字评分（如 "72%"），48px / font-weight: 800 / color: #fff
- 右侧：岗位名称 + 生成耗时 + 一句话总结

### 双栏主体布局
- 左侧边栏（200px宽，sticky）：
  - 导航标签：📄 理想简历 / 🔴 致命差距 / 🟡 核心差距 / 🟢 表达优化
  - 当前项高亮：深色背景 `#0A0A0F` + 白色文字
  - 底部导出按钮：深色底 + 白色文字
- 右侧内容区：
  - **理想简历卡片**：纯白背景 `#fff` + 细边框，内部 Markdown 渲染为深色文字（因为这是打印/导出预览，需要高对比度）
  - **差距报告卡片**：
    - 致命差距：`background: #FEF2F2; border: 1px solid #FECACA`
    - 核心差距：`background: #FFFBEB; border: 1px solid #FDE68A`
    - 表达优化：`background: #F0FDF4; border: 1px solid #BBF7D0`
    - 卡片内部左侧有一个 4px 宽的颜色条（红/黄/绿）

### Loading 状态
- 页面中央：一个极简的旋转圆环（2px 白色边框，1 段透明）
- 下方：当前步骤文字 + 已耗时
- 背景保持流体动画继续运行

## 交互动画规格（Framer Motion）

### 入场动画
- 页面加载时，Hero 文字和表单从下方淡入上滑（`y: 30 → 0`, `opacity: 0 → 1`）， stagger 间隔 0.1s
- 表单卡片单独延迟 0.2s 入场

### 滚动动画
- Features 卡片：滚动到视口时从下方淡入，stagger 0.15s
- 结果页差距卡片：依次从右侧滑入

### Hover 效果
- 导航按钮：`scale(1.02)` + `translateY(-1px)`，0.2s ease
- 标签按钮：背景色过渡 0.2s
- 功能卡片：`translateY(-2px)` + 边框亮度提升

### 状态切换
- 表单提交 → Loading：表单淡出，loading 区域淡入
- Loading → 结果：评分区从上方滑入，内容区依次展开

## 技术栈

- **框架**：Next.js 14 App Router（已有）
- **样式**：Tailwind CSS（已有）
- **动画**：Framer Motion（新增依赖）
- **字体**：系统字体栈（Inter / SF Pro Display 优先）
- **图标**：Lucide React（已有）

## 响应式

- 桌面端：双栏布局（结果页）
- 平板/移动端：单栏，侧边栏变为顶部横向滚动标签
- 表单单列不变，最大宽度限制在 560px

## 文件变更预估

1. `frontend/app/globals.css` — 重写全局样式（暗黑模式、字体、动画 keyframes）
2. `frontend/app/layout.tsx` — 更新 metadata、字体引用
3. `frontend/app/page.tsx` — 重写首页结构
4. `frontend/app/result/page.tsx` — 重写结果页结构
5. `frontend/components/ideal-input-form.tsx` — 重写为毛玻璃暗黑表单
6. `frontend/components/ideal-result-view.tsx` — 重写为双栏布局 + 新卡片样式
7. `frontend/package.json` — 新增 `framer-motion` 依赖
8. `frontend/tailwind.config.ts` — 扩展自定义颜色和动画
