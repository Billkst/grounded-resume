"use client"

import { useState } from "react"

export default function InputForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    jobTitle: "",
    jobDescription: "",
  })

  const [materials, setMaterials] = useState([""])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const updateMaterial = (index: number, value: string) => {
    const next = [...materials]
    next[index] = value
    setMaterials(next)
    if (errors.materials) {
      setErrors((prev) => {
        const n = { ...prev }
        delete n.materials
        return n
      })
    }
  }

  const addMaterial = () => {
    setMaterials((prev) => [...prev, ""])
  }

  const removeMaterial = (index: number) => {
    if (materials.length <= 1) return
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!formData.name.trim()) nextErrors.name = "请输入姓名"
    if (!formData.email.trim()) {
      nextErrors.email = "请输入邮箱"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "请输入有效的邮箱地址"
    }
    if (!formData.company.trim()) nextErrors.company = "请输入公司名"
    if (!formData.jobTitle.trim()) nextErrors.jobTitle = "请输入岗位名称"
    if (!formData.jobDescription.trim()) {
      nextErrors.jobDescription = "请输入岗位描述"
    } else if (formData.jobDescription.trim().length < 50) {
      nextErrors.jobDescription = "岗位描述至少 50 个字符"
    }
    if (materials.length === 0 || materials.every((m) => !m.trim())) {
      nextErrors.materials = "请至少提供一条素材"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      ...formData,
      materials: materials.filter((m) => m.trim()),
    }
    console.log("Submit:", payload)
  }

  const inputBase =
    "w-full bg-transparent border-b border-bone/20 px-0 py-3 text-paper placeholder:text-bone/30 outline-none transition-all focus:border-oxidized-cyan focus:shadow-[0_4px_16px_-6px_rgba(45,156,168,0.25)]"

  const labelBase =
    "block mb-2 font-interface text-[11px] font-medium uppercase tracking-wider text-bone/50"

  return (
    <form
      onSubmit={handleSubmit}
      className="relative rounded-xl border border-bone/10 bg-graphite/80 p-8 shadow-2xl backdrop-blur-xl lg:p-10"
      noValidate
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-oxidized-cyan/40 to-transparent" />

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-paper">
            档案录入
          </h2>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone/35">
            Case Intake Form // v1.0
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-bone/10 bg-ink/30">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-oxidized-cyan"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelBase}>
            姓名 / Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputBase}
            placeholder="你的姓名"
          />
          {errors.name && (
            <p className="mt-2 flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
              <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={labelBase}>
            邮箱 / Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            className={inputBase}
            placeholder="name@example.com"
          />
          {errors.email && (
            <p className="mt-2 flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
              <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="company" className={labelBase}>
            目标公司 / Target Company
          </label>
          <input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => updateField("company", e.target.value)}
            className={inputBase}
            placeholder="公司名称"
          />
          {errors.company && (
            <p className="mt-2 flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
              <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
              {errors.company}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="jobTitle" className={labelBase}>
            岗位名称 / Position
          </label>
          <input
            id="jobTitle"
            type="text"
            value={formData.jobTitle}
            onChange={(e) => updateField("jobTitle", e.target.value)}
            className={inputBase}
            placeholder="例如：前端开发工程师"
          />
          {errors.jobTitle && (
            <p className="mt-2 flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
              <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
              {errors.jobTitle}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="jobDescription" className={labelBase}>
          岗位描述 / Job Description
        </label>
        <textarea
          id="jobDescription"
          rows={4}
          value={formData.jobDescription}
          onChange={(e) => updateField("jobDescription", e.target.value)}
          className="w-full resize-none rounded-md border border-bone/15 bg-transparent px-3 py-3 text-paper placeholder:text-bone/30 outline-none transition-all focus:border-oxidized-cyan/60 focus:shadow-[0_0_0_1px_rgba(45,156,168,0.25),0_0_24px_-4px_rgba(45,156,168,0.15)]"
          placeholder="请粘贴完整的岗位 JD，至少 50 个字符"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-[10px] text-bone/25">
            {formData.jobDescription.length} chars
          </span>
          {errors.jobDescription && (
            <p className="flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
              <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
              {errors.jobDescription}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-paper">
              证据素材
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bone/35">
              Evidence Materials
            </p>
          </div>
          <span className="rounded bg-bone/5 px-2 py-1 font-mono text-[10px] text-bone/30">
            REQ &gt;= 1
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {materials.map((material, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-lg border border-bone/10 bg-ink/40 p-4 transition-all hover:border-bone/20"
          >
            <div className="absolute bottom-0 left-0 top-0 w-[2px] bg-gradient-to-b from-brass/50 via-brass/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-bone/10 font-mono text-[10px] font-semibold text-brass">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-bone/40">
                  Evidence #{String(index + 1).padStart(3, "0")}
                </span>
              </div>
              {materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-verdict-red/70 transition hover:bg-verdict-red/10 hover:text-verdict-red"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={material}
              onChange={(e) => updateMaterial(index, e.target.value)}
              className="w-full resize-none bg-transparent text-sm leading-relaxed text-paper placeholder:text-bone/25 outline-none"
              placeholder="描述一段经历，包含背景、你的职责、使用的技术和取得的成果..."
            />
          </div>
        ))}
      </div>

      {errors.materials && (
        <p className="mt-3 flex items-center gap-2 border-l-2 border-verdict-red pl-3 text-sm text-verdict-red">
          <span className="inline-block h-1 w-1 rounded-full bg-verdict-red" />
          {errors.materials}
        </p>
      )}

      <button
        type="button"
        onClick={addMaterial}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-dashed border-bone/20 px-4 py-2.5 font-interface text-sm text-bone/60 transition hover:border-brass/50 hover:text-brass"
      >
        <span className="text-lg leading-none">+</span>
        添加素材
      </button>

      <div className="mt-10 flex items-center justify-end gap-4">
        <span className="font-mono text-[10px] text-bone/25">
          {materials.filter((m) => m.trim()).length} evidence(s) ready
        </span>
        <button
          type="submit"
          className="rounded-lg bg-brass px-8 py-3.5 font-interface text-sm font-semibold text-ink shadow-lg shadow-brass/10 transition hover:shadow-[0_0_40px_rgba(184,137,59,0.25)] active:scale-[0.98]"
        >
          生成简历
        </button>
      </div>
    </form>
  )
}
