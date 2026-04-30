import InputForm from "@/components/input-form"

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink">
      <div className="grid min-h-screen lg:grid-cols-5">
        <section className="relative flex flex-col justify-center px-8 py-20 lg:col-span-2 lg:px-16 xl:px-24">
          <div className="pointer-events-none absolute -left-12 top-20 select-none font-display text-[14rem] font-bold leading-none text-bone/[0.02] lg:text-[18rem]">
            GR
          </div>

          <div className="relative z-10 max-w-lg">
            <p
              className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-oxidized-cyan animate-fade-in-up"
              style={{ animationDelay: "0.1s" }}
            >
              Forensic Resume Atelier
            </p>

            <h1
              className="font-display text-7xl font-bold leading-[0.92] tracking-tight text-paper lg:text-8xl xl:text-9xl animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              grounded
              <br />
              <span className="italic text-brass">resume</span>
            </h1>

            <p
              className="mt-10 max-w-md font-interface text-base leading-relaxed text-bone/70 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              基于真实经历，生成岗位定制简历。上传你的原始素材与目标 JD，我们像取证分析师一样，从中提取、重组、打磨出一份精准匹配的第一版简历。
            </p>

            <div
              className="mt-14 animate-fade-in-up"
              style={{ animationDelay: "0.55s" }}
            >
              <div className="flex items-center gap-5">
                {[
                  { n: "01", label: "输入素材", active: true },
                  { n: "02", label: "确认提取", active: false },
                  { n: "03", label: "获取结果", active: false },
                ].map((step, i) => (
                  <div key={step.n} className="flex items-center gap-5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                          step.active
                            ? "border-oxidized-cyan/30 bg-oxidized-cyan/10"
                            : "border-bone/15"
                        }`}
                      >
                        <span
                          className={`font-mono text-xs ${
                            step.active ? "text-oxidized-cyan" : "text-bone/35"
                          }`}
                        >
                          {step.n}
                        </span>
                      </div>
                      <span
                        className={`font-mono text-xs ${
                          step.active ? "text-bone/70" : "text-bone/35"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && <div className="h-px w-5 bg-bone/15" />}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-16 animate-fade-in-up"
              style={{ animationDelay: "0.7s" }}
            >
              <div className="inline-flex items-center gap-2.5 rounded-full border border-bone/10 bg-graphite/50 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-evidence-green opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-evidence-green" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-bone/40">
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-6 py-12 lg:col-span-3 lg:px-12 xl:px-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(to right, #DDD2BE 1px, transparent 1px), linear-gradient(to bottom, #DDD2BE 1px, transparent 1px)`,
              backgroundSize: "56px 56px",
            }}
          />
          <div
            className="relative w-full max-w-3xl animate-fade-in-up"
            style={{ animationDelay: "0.35s" }}
          >
            <InputForm />
          </div>
        </section>
      </div>

    </main>
  )
}
