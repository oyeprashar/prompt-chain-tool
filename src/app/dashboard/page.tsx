import Link from "next/link";
import { ArrowRight, Layers3, Plus, ShieldCheck, Workflow } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { createChain } from "./actions";

type Chain = { id: string; name: string; description: string; created_at: string };

export default async function Dashboard({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireSuperadmin();
  const supabase = await createClient();
  const { data: chains, error: loadError } = await supabase.from("prompt_chains")
    .select("id, name, description, created_at").order("created_at", { ascending: false });
  const { error } = await searchParams;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 backdrop-blur-xl sm:px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Layers3 className="text-indigo-300" size={25} />
          <span className="text-lg font-semibold">Prompt Chain Tool</span>
        </Link>
        <form action={signOut}>
          <button type="submit" className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sign out</button>
        </form>
      </header>

      <section className="py-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300"><ShieldCheck size={15} /> Superadmin verified</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em]">Prompt chains</h1>
          <p className="mt-2 text-slate-400">Build and run reusable creative workflows. Signed in as {user.email ?? "a superadmin"}.</p></div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3"><Workflow size={20} className="text-indigo-300" /><div><p className="text-xl font-semibold">{chains?.length ?? 0}</p><p className="text-xs text-slate-400">total chains</p></div></div>
        </div>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm">{error}</p> : null}
        {loadError ? <p role="alert" className="mt-5 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm">Could not load chains. Run the migration in supabase/migrations first.</p> : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
        <form action={createChain} className="app-panel rounded-3xl p-6 lg:sticky lg:top-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300"><Plus size={20} /></div>
          <h2 className="mt-5 text-lg font-semibold">Create a new chain</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Start with a name. You’ll add and arrange prompts on the next screen.</p>
          <div className="mt-5 grid gap-4">
            <label className="text-sm">Name
              <input name="name" required maxLength={120} placeholder="Funny image captions" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5" />
            </label>
            <label className="text-sm">Description (optional)
              <textarea name="description" maxLength={1000} rows={3} placeholder="What this chain does" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5" />
            </label>
          </div>
          <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500">Create chain <ArrowRight size={15} /></button>
        </form>

        <div><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your workspace</h2><span className="text-xs text-slate-500">Newest first</span></div>
        <div className="mt-4 grid gap-3">
          {(chains as Chain[] | null)?.map(chain => (
            <Link key={chain.id} href={`/dashboard/chains/${chain.id}`} className="group app-panel rounded-2xl p-5 hover:-translate-y-0.5 hover:border-indigo-500/70">
              <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{chain.name}</h3>
              {chain.description ? <p className="mt-1 text-sm text-slate-400">{chain.description}</p> : null}
              <p className="mt-4 text-xs text-slate-500">Created {new Date(chain.created_at).toLocaleDateString()}</p></div><span className="rounded-xl border border-slate-700 p-2 text-slate-400 group-hover:border-indigo-500/50 group-hover:text-indigo-300"><ArrowRight size={16} /></span></div>
            </Link>
          ))}
          {!loadError && !chains?.length ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No chains yet. Create one above.</div> : null}
        </div></div></div>
      </section>
    </main>
  );
}
