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
    "w-full rounded-lg border border-charcoal/10 bg-cream px-4 py-3 text-charcoal placeholder:text-charcoal/40 outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta"

  const labelBase = "block mb-2 text-sm font-semibold tracking-wide text-charcoal"

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-charcoal/8 bg-warmgray p-8 shadow-sm"
      noValidate
    >
      <div className="mb-8">
        <h2 className="font-serif text-2xl font-bold text-charcoal">基本信息</h2>
        <div className="mt-1 h-px w-12 bg-terracotta" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelBase}>
            姓名
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
            <p className="mt-1.5 text-sm text-softred">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={labelBase}>
            邮箱
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
            <p className="mt-1.5 text-sm text-softred">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="company" className={labelBase}>
            目标公司
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
            <p className="mt-1.5 text-sm text-softred">{errors.company}</p>
          )}
        </div>

        <div>
          <label htmlFor="jobTitle" className={labelBase}>
            岗位名称
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
            <p className="mt-1.5 text-sm text-softred">{errors.jobTitle}</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="jobDescription" className={labelBase}>
          岗位描述
        </label>
        <textarea
          id="jobDescription"
          rows={5}
          value={formData.jobDescription}
          onChange={(e) => updateField("jobDescription", e.target.value)}
          className={`${inputBase} resize-none`}
          placeholder="请粘贴完整的岗位 JD，至少 50 个字符"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-charcoal/50">
            当前 {formData.jobDescription.length} 字符
          </span>
          {errors.jobDescription && (
            <p className="text-sm text-softred">{errors.jobDescription}</p>
          )}
        </div>
      </div>

      <div className="mt-10 mb-8">
        <h2 className="font-serif text-2xl font-bold text-charcoal">个人素材</h2>
        <div className="mt-1 h-px w-12 bg-terracotta" />
        <p className="mt-2 text-sm text-charcoal/60">
          添加你的项目经历、实习经历、研究成果等原始素材，至少填写一项。
        </p>
      </div>

      <div className="space-y-4">
        {materials.map((material, index) => (
          <div
            key={index}
            className="group relative rounded-xl border border-charcoal/8 bg-cream p-4 transition hover:border-charcoal/15"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
                素材 {index + 1}
              </span>
              {materials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  className="rounded-md px-2 py-1 text-xs text-softred transition hover:bg-softred/10"
                >
                  删除
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={material}
              onChange={(e) => updateMaterial(index, e.target.value)}
              className={`${inputBase} border-0 bg-transparent p-0 focus:ring-0`}
              placeholder="描述一段经历，包含背景、你的职责、使用的技术和取得的成果..."
            />
          </div>
        ))}
      </div>

      {errors.materials && (
        <p className="mt-3 text-sm text-softred">{errors.materials}</p>
      )}

      <button
        type="button"
        onClick={addMaterial}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-charcoal/25 px-4 py-2.5 text-sm font-medium text-charcoal/70 transition hover:border-terracotta hover:text-terracotta"
      >
        <span className="text-lg leading-none">+</span>
        添加素材
      </button>

      <div className="mt-10 flex justify-end">
        <button
          type="submit"
          className="rounded-xl bg-charcoal px-8 py-3.5 font-serif text-base font-semibold text-cream shadow-sm transition hover:bg-charcoal/90 active:scale-[0.98]"
        >
          生成简历
        </button>
      </div>
    </form>
  )
}
