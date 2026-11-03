import Link from "next/link";
import { RunForm } from "./run-form";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, Layers3, Trash2 } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addStep, deleteChain, deleteStep, moveStep, updateChain, updateStep } from "../../actions";

type Chain = { id: string; name: string; description: string };
type Step = { id: string; chain_id: string; title: string; prompt: string; position: number };
type Run = { id: string; status: string; input_text: string; input_image_name: string | null; step_results: { step_id: string; title: string; output: string }[] | null; final_output: string | null; error_message: string | null; created_at: string };

const inputClass = "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm";
const buttonClass = "rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800";

export default async function ChainDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSuperadmin();
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: chain, error: chainError } = await supabase.from("prompt_chains")
    .select("id, name, description").eq("id", id).maybeSingle();
  if (chainError || !chain) notFound();

  const { data: steps, error: stepsError } = await supabase.from("prompt_chain_steps")
    .select("id, chain_id, title, prompt, position").eq("chain_id", id)
    .order("position", { ascending: true }).order("id", { ascending: true });
  const orderedSteps = (steps ?? []) as Step[];
  const { data: runs, error: runsError } = await supabase.from("prompt_chain_runs")
    .select("id, status, input_text, input_image_name, step_results, final_output, error_message, created_at")
    .eq("chain_id", id).order("created_at", { ascending: false }).limit(20);

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16} /> Back to chains</Link>
        <span className="flex items-center gap-2 text-sm text-indigo-300"><Layers3 size={18} /> Prompt Chain Tool</span>
      </header>
      <section className="py-10">
        <h1 className="text-3xl font-bold">{(chain as Chain).name}</h1>
        <p className="mt-2 text-slate-400">Manage this chain and its execution order.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm">{error}</p> : null}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="font-semibold">Chain details</h2>
          <form action={updateChain} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="text-sm">Name<input className={inputClass} name="name" defaultValue={chain.name} maxLength={120} required /></label>
            <label className="text-sm">Description<textarea className={inputClass} name="description" defaultValue={chain.description} maxLength={1000} rows={2} /></label>
            <button type="submit" className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">Save chain</button>
          </form>
          <form action={deleteChain} className="mt-5 border-t border-slate-800 pt-4">
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="flex items-center gap-2 text-sm text-rose-300 hover:text-rose-200"><Trash2 size={15} /> Delete chain and all its steps</button>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Steps ({orderedSteps.length})</h2>
          <span className="text-xs text-slate-400">Use arrows to change order</span>
        </div>
        {stepsError ? <p role="alert" className="mt-4 text-sm text-rose-300">Could not load steps.</p> : null}
        <div className="mt-4 grid gap-4">
          {orderedSteps.map((step, index) => (
            <article key={step.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Step {index + 1}</h3>
                <div className="flex gap-2">
                  {([-1, 1] as const).map(direction => (
                    <form key={direction} action={moveStep}>
                      <input type="hidden" name="id" value={step.id} />
                      <input type="hidden" name="chain_id" value={id} />
                      <input type="hidden" name="direction" value={direction} />
                      <button type="submit" disabled={direction === -1 ? index === 0 : index === orderedSteps.length - 1} aria-label={direction === -1 ? "Move step up" : "Move step down"} className={buttonClass + " disabled:cursor-not-allowed disabled:opacity-30"}>
                        {direction === -1 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
              <form action={updateStep} className="grid gap-3">
                <input type="hidden" name="id" value={step.id} />
                <input type="hidden" name="chain_id" value={id} />
                <label className="text-sm">Title<input className={inputClass} name="title" defaultValue={step.title} maxLength={120} required /></label>
                <label className="text-sm">Prompt<textarea className={inputClass} name="prompt" defaultValue={step.prompt} maxLength={10000} rows={4} required /></label>
                <button type="submit" className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">Save step</button>
              </form>
              <form action={deleteStep} className="mt-4">
                <input type="hidden" name="id" value={step.id} />
                <input type="hidden" name="chain_id" value={id} />
                <button type="submit" className="flex items-center gap-2 text-sm text-rose-300"><Trash2 size={14} /> Delete step</button>
              </form>
            </article>
          ))}
          {!stepsError && orderedSteps.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">No steps yet. Add your first prompt below.</p> : null}
        </div>

        <form action={addStep} className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <input type="hidden" name="chain_id" value={id} />
          <h2 className="font-semibold">Add step</h2>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Title<input className={inputClass} name="title" placeholder="Summarize the input" maxLength={120} required /></label>
            <label className="text-sm">Prompt<textarea className={inputClass} name="prompt" placeholder="Describe the image in one sentence..." maxLength={10000} rows={4} required /></label>
          </div>
          <button type="submit" className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm hover:bg-indigo-500">Add step</button>
        </form>

        <section className="mt-12 rounded-xl border border-indigo-500/30 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold">Run this chain</h2>
          <p className="mt-2 text-sm text-slate-400">Gemini processes each prompt in order. The previous step&apos;s response becomes the next step&apos;s input.</p>
          <RunForm chainId={id} disabled={orderedSteps.length === 0} />
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Recent runs</h2>
          {runsError ? <p role="alert" className="mt-3 text-sm text-amber-300">Could not load run history. Apply the runs SQL migration first.</p> : null}
          <div className="mt-4 grid gap-4">
            {(runs as Run[] | null)?.map(run => (
              <article key={run.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{new Date(run.created_at).toLocaleString()}</span>
                  <span className={run.status === "completed" ? "text-sm text-emerald-300" : run.status === "failed" ? "text-sm text-rose-300" : "text-sm text-amber-300"}>{run.status}</span>
                </div>
                {run.input_text ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">Input: {run.input_text}</p> : null}
                {run.input_image_name ? <p className="mt-2 text-xs text-slate-400">Image: {run.input_image_name}</p> : null}
                {run.step_results?.map((result, index) => (
                  <div key={result.step_id + index} className="mt-4 border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-semibold text-indigo-300">Step {index + 1}: {result.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{result.output}</p>
                  </div>
                ))}
                {run.error_message ? <p className="mt-4 text-sm text-rose-300">Error: {run.error_message}</p> : null}
              </article>
            ))}
            {!runsError && !runs?.length ? <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">No runs yet. Execute this chain above.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
