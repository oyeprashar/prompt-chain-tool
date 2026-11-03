import Link from "next/link";
import { ArrowRight, Layers3, ListOrdered, Play, ShieldCheck } from "lucide-react";

const features = [
  { title: "Create chains", description: "Group related prompts into reusable workflows.", icon: Layers3 },
  { title: "Manage steps", description: "Add, edit, and reorder prompts inside a chain.", icon: ListOrdered },
  { title: "Run prompts", description: "Pass one step's output into the next step.", icon: Play },
];

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><Layers3 size={23} /></div>
          <span className="text-lg font-semibold">Prompt Chain Tool</span>
        </div>
        <Link href="/auth/sign-in" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">
          Sign in with Google
        </Link>
      </header>

      <section className="pb-12 pt-24">
        <p className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-300"><ShieldCheck size={16} /> Superadmin workspace</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Build better prompts, one step at a time.</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">Create prompt chains, organize their steps, and run multi-step AI workflows from a single place.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-200">Sign-in did not complete. Please try again.</p> : null}
        <Link href="/auth/sign-in" className="mt-8 inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 hover:bg-indigo-500/20">
          Continue with Google <ArrowRight size={16} />
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {features.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <Icon className="mb-5 text-indigo-300" size={26} />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
