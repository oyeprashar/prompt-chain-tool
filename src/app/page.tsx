import Link from "next/link";
import { ArrowRight, ImageIcon, Layers3, ListOrdered, Play, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  { title: "Create chains", description: "Group related prompts into reusable workflows.", icon: Layers3 },
  { title: "Manage steps", description: "Add, edit, and reorder prompts inside a chain.", icon: ListOrdered },
  { title: "Run prompts", description: "Pass one step's output into the next step.", icon: Play },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 backdrop-blur-xl sm:px-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><Layers3 size={23} /></div>
          <span className="text-lg font-semibold">Prompt Chain Tool</span>
        </div>
        <Link href="/auth/sign-in" className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:-translate-y-0.5 hover:bg-indigo-50">
          Admin sign in
        </Link>
      </header>

      <section className="grid items-center gap-14 pb-16 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:pt-28">
        <div>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300"><ShieldCheck size={14} /> Superadmin workspace</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl">Ideas in. <span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-200 bg-clip-text text-transparent">Creative systems</span> out.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Design reusable AI workflows, connect each prompt to the next, and generate text and images without losing the thread.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">Sign-in did not complete. Please try again.</p> : null}
        <Link href="/auth/sign-in" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/40 hover:-translate-y-0.5 hover:bg-indigo-400">
          Open the workspace <ArrowRight size={16} />
        </Link>
        </div>

        <div className="app-panel relative rounded-3xl p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Example chain</p><h2 className="mt-1 font-semibold">Campaign caption studio</h2></div>
            <Sparkles className="text-indigo-300" size={20} />
          </div>
          <div className="space-y-3">
            {["Describe the uploaded image", "Find the funniest angle", "Write five short captions"].map((step, index) => (
              <div key={step} className="relative flex items-center gap-4 rounded-2xl border border-slate-700/70 bg-slate-950/60 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">{String(index + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium">{step}</p><p className="mt-1 text-xs text-slate-500">{index === 0 ? "Image → text" : "Previous output → text"}</p></div>
                {index === 0 ? <ImageIcon size={16} className="text-slate-500" /> : <ArrowRight size={16} className="text-slate-500" />}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-3 text-white">
            <span className="text-sm font-semibold">Ready to run</span><Play size={16} fill="currentColor" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="app-panel rounded-2xl p-6">
            <Icon className="mb-5 text-indigo-300" size={26} />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
