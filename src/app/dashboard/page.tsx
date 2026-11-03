import { Layers3, ListOrdered, Play, ShieldCheck } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth";
import { signOut } from "@/app/auth/actions";

export default async function Dashboard() {
  const user = await requireSuperadmin();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Layers3 className="text-indigo-300" size={25} />
          <span className="text-lg font-semibold">Prompt Chain Tool</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800">
            Sign out
          </button>
        </form>
      </header>

      <section className="py-16">
        <p className="flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck size={16} /> Superadmin verified</p>
        <h1 className="mt-4 text-4xl font-bold">Your prompt chains</h1>
        <p className="mt-3 text-slate-400">Signed in as {user.email ?? "a superadmin"}.</p>
        <div className="mt-10 rounded-2xl border border-dashed border-slate-700 p-10 text-center">
          <ListOrdered className="mx-auto text-indigo-300" size={34} />
          <h2 className="mt-4 text-lg font-semibold">No chains yet</h2>
          <p className="mt-2 text-sm text-slate-400">Creating and editing prompt chains comes next.</p>
          <p className="mt-5 inline-flex items-center gap-2 text-sm text-indigo-300"><Play size={15} /> Authentication is ready for testing</p>
        </div>
      </section>
    </main>
  );
}
