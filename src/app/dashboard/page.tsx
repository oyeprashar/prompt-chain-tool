import Link from "next/link";
import { Layers3, ShieldCheck } from "lucide-react";
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
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Layers3 className="text-indigo-300" size={25} />
          <span className="text-lg font-semibold">Prompt Chain Tool</span>
        </Link>
        <form action={signOut}>
          <button type="submit" className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">Sign out</button>
        </form>
      </header>

      <section className="py-12">
        <p className="flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck size={16} /> Superadmin verified</p>
        <h1 className="mt-4 text-3xl font-bold">Your prompt chains</h1>
        <p className="mt-2 text-slate-400">Signed in as {user.email ?? "a superadmin"}.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm">{error}</p> : null}
        {loadError ? <p role="alert" className="mt-5 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm">Could not load chains. Run the migration in supabase/migrations first.</p> : null}

        <form action={createChain} className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="text-lg font-semibold">Create a new chain</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">Name
              <input name="name" required maxLength={120} placeholder="Funny image captions" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
            <label className="text-sm">Description (optional)
              <textarea name="description" maxLength={1000} rows={2} placeholder="What this chain does" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" />
            </label>
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500">Create chain</button>
        </form>

        <h2 className="mt-10 text-lg font-semibold">Existing chains</h2>
        <div className="mt-4 grid gap-3">
          {(chains as Chain[] | null)?.map(chain => (
            <Link key={chain.id} href={`/dashboard/chains/${chain.id}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-indigo-500">
              <h3 className="font-semibold">{chain.name}</h3>
              {chain.description ? <p className="mt-1 text-sm text-slate-400">{chain.description}</p> : null}
              <p className="mt-3 text-xs text-indigo-300">Edit chain and steps →</p>
            </Link>
          ))}
          {!loadError && !chains?.length ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No chains yet. Create one above.</div> : null}
        </div>
      </section>
    </main>
  );
}
