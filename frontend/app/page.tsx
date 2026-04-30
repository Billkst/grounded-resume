import InputForm from "@/components/input-form"

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="font-display text-5xl font-bold tracking-tight text-charcoal">
          grounded-resume
        </h1>
        <p className="mt-4 font-serif text-lg italic text-charcoal/70">
          基于真实经历，生成岗位定制简历
        </p>
      </header>

      <div className="w-full">
        <InputForm />
      </div>
    </main>
  )
}
