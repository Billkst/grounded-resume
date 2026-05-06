# grounded-resume 前后端联调手动测试文档

> 版本：v0.2.0（前后端连接完成）
> 适用 Commit：`78678ff` 之后（含 8 个 integration commits）
> 测试日期：____年____月____日
> 测试人：____________

---

## 1. 环境准备

### 1.1 启动后端 API

```bash
cd /home/liujunxi/CodeSpace/grounded-resume
python3 -m uvicorn grounded_resume.api.main:app --reload --port 8000
```

**预期输出：**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**检查清单：**
- [ ] 端口 8000 未被占用
- [ ] 启动无报错（ ImportError / ModuleNotFoundError 等）

### 1.2 启动前端 Dev Server

```bash
cd /home/liujunxi/CodeSpace/grounded-resume/frontend
npm run dev
```

**预期输出：**
```
▲ Next.js 14.2.3
- Local:        http://localhost:3000

✓ Ready in Xs
```

> 如果 3000 被占用，Next.js 会自动切到 3001，请留意终端提示。

**检查清单：**
- [ ] 前端成功启动
- [ ] 浏览器能访问 `http://localhost:3000`

### 1.3 可选：配置 API 地址

如果前端和后端不在同一台机器上，或端口有变化：

```bash
cd frontend
cp .env.local.example .env.local
# 编辑 .env.local，修改 NEXT_PUBLIC_API_BASE_URL
```

---

## 2. API 健康检查（先测接口再测页面）

### 2.1 Health Check

```bash
curl http://localhost:8000/health
```

**预期结果：**
```json
{"status":"ok","version":"0.1.0"}
```

- [ ] 通过

### 2.2 CORS 预检

```bash
curl -X OPTIONS http://localhost:8000/sessions \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -v
```

**预期结果：**
- HTTP 200
- 响应头包含 `access-control-allow-origin: http://localhost:3000`

- [ ] 通过

### 2.3 创建会话（端到端工作流）

```bash
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {"name": "张三", "email": "zhangsan@example.com"},
    "targetJob": {
      "companyName": "字节跳动",
      "jobTitle": "AI产品经理实习生",
      "jobDescription": "负责AI产品功能设计与迭代，协助完成用户调研、竞品分析和数据分析工作。要求熟悉Python、SQL，具备良好的沟通能力和产品思维。需要本科及以上在读，实习周期不少于3个月。"
    },
    "materials": [
      {"id": "M001", "type": "project", "title": "AI产品分析", "content": "参与了5-6款AI产品的功能更新，输出结构化分析报告，为团队迭代提供参考"}
    ]
  }'
```

**预期结果：**
```json
{"sessionId":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","status":"completed"}
```

- [ ] 返回 `sessionId`（32 位 hex 字符串）
- [ ] 返回 `status: completed`

**记录 sessionId：** `________________________________`

### 2.4 查询会话详情

用上面得到的 sessionId 替换 `{sessionId}`：

```bash
curl http://localhost:8000/sessions/{sessionId}
```

**预期结果：**
```json
{
  "sessionId": "xxxxxxxx...",
  "status": "completed",
  "result": {
    "draft": { "version": 1, "sections": [...] },
    "mappingResult": { "mappings": [...], "gaps": [...], "mappingConfidence": 0.72 }
  },
  "finalOutput": null
}
```

- [ ] `result.draft` 存在且包含 `sections[].bullets[]`
- [ ] `result.mappingResult.gaps` 存在
- [ ] `finalOutput` 为 `null`（尚未提交决策）

### 2.5 提交决策

```bash
curl -X POST http://localhost:8000/sessions/{sessionId}/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {"confirmationItemId": "B001", "bulletId": "B001", "decision": "approve", "timestamp": "2026-04-30T12:00:00Z"}
    ],
    "gapAcknowledgments": []
  }'
```

```
curl -X POST http://localhost:8000/sessions/e1cea10037ff466a94f8a8a7f14ad8de/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {"confirmationItemId": "B001", "bulletId": "B001", "decision": "approve", "timestamp": "2026-04-30T12:00:00Z"}
    ],
    "gapAcknowledgments": []
  }'

```


**预期结果：**
```json
{
  "sessionId": "xxxxxxxx...",
  "status": "completed",
  "finalOutput": {
    "resume": {...},
    "metadata": {...},
    "attachments": [...],
    "resumeMarkdown": "# ..."
  }
}
```

- [ ] `finalOutput` 不为 `null`
- [ ] `finalOutput.resumeMarkdown` 存在且非空

---

## 3. 浏览器端功能测试

### 3.1 首页（Homepage）

**测试步骤：**
1. 打开 `http://localhost:3000`
2. 等待页面加载完成（看到 Forensic Resume Atelier 标题）

**检查清单：**
- [ ] 页面正常显示，无 "Application error" 白屏
- [ ] 左侧显示 "grounded / resume" 品牌标题
- [ ] 右侧显示"档案录入"表单卡片
- [ ] 表单包含：姓名、邮箱、目标公司、岗位名称、岗位描述、证据素材

**测试步骤（表单提交）：**
1. 姓名：填写 "张某某"
2. 邮箱：填写 "zhang@example.com"
3. 目标公司：填写 "字节跳动"
4. 岗位名称：填写 "AI产品经理实习生"
5. 岗位描述：填写（≥50 字符）：
   > 负责AI产品功能设计与迭代，协助完成用户调研、竞品分析和数据分析工作。要求熟悉Python、SQL，具备良好的沟通能力和产品思维。
6. 证据素材 #001：填写 "参与了5-6款AI产品的功能更新，输出结构化分析报告"
7. 点击"生成简历"按钮

**预期结果：**
- [ ] 按钮文字变为"生成中..."，按钮禁用
- [ ] 无红色错误提示出现
- [ ] 约 1-3 秒后自动跳转到确认页
- [ ] URL 变为 `/confirmation?sessionId=xxxxxxxx...`

**如果失败：**
- 打开浏览器 DevTools → Console，查看是否有 CORS 错误（红字）
- 打开 Network 面板，查看 `sessions` 请求的 Status 和 Response

---

### 3.2 确认页（Confirmation）

**测试步骤：**
1. 确认页加载后，等待"正在加载确认数据"消失
2. 查看顶部案件档案信息

**检查清单：**
- [ ] 显示 "CONFIRMATION REVIEW" 标题
- [ ] 右上角显示正确的公司名和岗位名（如"字节跳动 · AI产品经理实习生"）
- [ ] 显示指标：Coverage / Confidence / Evidence
- [ ] 页面中央显示证据卡片（至少 1 张）
- [ ] 每张卡片包含：简历表达 / 证据来源 / 映射分析 / 操作按钮

**测试步骤（决策操作）：**
1. 对第一条 bullet 点击"认可"
2. 对第二条 bullet（如果有）点击"修改"，在出现的文本框中修改文字
3. 对第三条 bullet（如果有）点击"拒绝"
4. 点击底部"提交确认并生成结果"

**预期结果：**
- [ ] 点击"认可"后按钮有视觉反馈（边框/背景变化）
- [ ] 点击"修改"后出现 textarea，可编辑文字
- [ ] 点击"拒绝"后 bullet 变灰或被标记
- [ ] 提交按钮变为"提交中..."
- [ ] 约 1-3 秒后跳转到结果页
- [ ] URL 变为 `/result?sessionId=xxxxxxxx...`

**如果失败：**
- DevTools Console 查看是否有 `fetch` 错误
- Network 面板查看 `decisions` 请求是否 404/500
- 如果显示"无法加载确认数据"，检查后端是否仍在运行

---

### 3.3 结果页（Result）

**测试步骤：**
1. 结果页加载后，等待"正在加载生成报告"消失

**检查清单：**
- [ ] 显示"生成报告"标题
- [ ] 右上角显示 4 个指标卡片（置信度 / 素材覆盖率 / Gap 数 / 版本）
- [ ] 左侧导航栏高亮"简历预览"
- [ ] 中央显示浅色纸张卡片（简历预览）
- [ ] 简历内容包含：姓名、求职意向、教育背景、项目经历、技能

**测试步骤（Tab 切换）：**
1. 点击"证据映射"
2. 点击"Gap 报告"
3. 点击"风险摘要"
4. 点击"修改指南"
5. 点击"简历预览"回到默认页

**预期结果：**
- [ ] 每个 tab 都能正常切换
- [ ] "证据映射"显示证据映射内容
- [ ] "Gap 报告"显示 Gap 审计卡片
- [ ] "风险摘要"显示风险分析
- [ ] "修改指南"显示修改建议

**如果失败：**
- 如果显示"结果尚未生成"，说明决策提交失败，返回确认页重试
- DevTools Console 查看 `getSession` 请求状态

---

## 4. 边界情况测试

### 4.1 直接访问无 sessionId 的确认页

**步骤：** 浏览器直接访问 `http://localhost:3000/confirmation`

**预期结果：**
- [ ] 显示错误页面："无法加载确认数据" + "缺少 sessionId" 提示

### 4.2 直接访问无 sessionId 的结果页

**步骤：** 浏览器直接访问 `http://localhost:3000/result`

**预期结果：**
- [ ] 显示错误页面："无法加载生成报告" + "缺少 sessionId" 提示

### 4.3 使用无效 sessionId

**步骤：** 访问 `http://localhost:3000/confirmation?sessionId=invalid123`

**预期结果：**
- [ ] 显示错误页面："无法加载确认数据" + "当前会话不存在或已经失效"
- [ ] 显示"重试"按钮

### 4.4 未提交决策直接访问结果页

**步骤：**
1. 创建新会话（通过首页表单或 curl）
2. 直接访问 `/result?sessionId=xxx`（不经过确认页提交决策）

**预期结果：**
- [ ] 显示错误页面："结果尚未生成"
- [ ] 显示"返回确认页"按钮，点击可回到确认页

### 4.5 后端宕机场景

**步骤：**
1. 正常进入首页，填写表单
2. 停止后端（Ctrl+C 终止 uvicorn）
3. 点击"生成简历"

**预期结果：**
- [ ] 按钮显示"生成中..."后变为可点击状态
- [ ] 页面显示红色错误提示（如 "Failed to fetch" 或 "请求失败"）
- [ ] 不跳转页面

---

## 5. 性能/体验检查

### 5.1 加载时间

| 环节 | 可接受时间 | 实际时间 |
|---|---|---|
| 首页首屏加载 | < 2s | ____s |
| 表单提交 → 确认页跳转 | < 5s | ____s |
| 确认页加载 bullets | < 3s | ____s |
| 提交决策 → 结果页跳转 | < 5s | ____s |
| 结果页加载 | < 3s | ____s |

### 5.2 响应式检查

**步骤：** 在浏览器 DevTools 中切换不同设备尺寸

- [ ] iPhone SE（375×667）：表单可正常填写，按钮可点击
- [ ] iPad（768×1024）：左右布局正常，卡片宽度合适
- [ ] Desktop（1440×900）：布局无溢出，字体大小合适

---

## 6. 已知限制（非 Bug）

| # | 现象 | 原因 | 处理方式 |
|---|---|---|---|
| 1 | 前端 dev server 可能自动切换到 3001 端口 | 3000 被其他进程占用 | 正常，按终端提示的端口访问 |
| 2 | 后端重启后历史 session 丢失 | ApiSessionStore 是内存存储 | 正常，MVP 暂未接入 SQLite 持久化 |
| 3 | 工作流结果每次可能略有不同 | LLM 生成具有随机性 | 正常，只要结构正确即可 |
| 4 | 确认页的"修改"按钮点击后 textarea 样式较简单 | MVP 优先功能完整 | 可接受 |

---

## 7. Bug 记录

如果在测试过程中发现问题，请记录在这里：

| # | 问题描述 | 复现步骤 | 预期结果 | 实际结果 | 严重程度 |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

---

## 8. 测试结论

| 检查项 | 结果 |
|---|---|
| API 健康检查 | □ 通过 □ 不通过 |
| CORS 预检 | □ 通过 □ 不通过 |
| 创建会话（curl） | □ 通过 □ 不通过 |
| 查询会话（curl） | □ 通过 □ 不通过 |
| 提交决策（curl） | □ 通过 □ 不通过 |
| 首页表单提交 | □ 通过 □ 不通过 |
| 确认页数据加载 | □ 通过 □ 不通过 |
| 确认页决策提交 | □ 通过 □ 不通过 |
| 结果页数据加载 | □ 通过 □ 不通过 |
| Tab 切换 | □ 通过 □ 不通过 |
| 边界情况（无 sessionId） | □ 通过 □ 不通过 |
| 边界情况（无效 sessionId） | □ 通过 □ 不通过 |
| 后端宕机容错 | □ 通过 □ 不通过 |

**总体结论：** □ 测试通过，可交付 / □ 存在阻塞问题，需修复

**签字：** ______________ **日期：** ______________
