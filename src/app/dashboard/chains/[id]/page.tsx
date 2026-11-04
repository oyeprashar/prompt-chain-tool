/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { RunForm } from "./run-form";
import { RunOutputActions } from "./run-output-actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, ImageIcon, Layers3, Play, Plus, Sparkles, Trash2, Type } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { addStep, deleteChain, deleteStep, moveStep, updateChain, updateStep } from "../../actions";

type Chain = { id: string; name: string; description: string };
type Step = { id: string; chain_id: string; title: string; prompt: string; position: number; output_type: "text" | "image" };
type Run = { id: string; status: string; input_text: string; input_image_name: string | null; input_image_path: string | null; step_results: { step_id: string; title: string; output: string; output_type?: string; image_path?: string }[] | null; final_output: string | null; error_message: string | null; created_at: string };

export const dynamic = "force-dynamic";

const inputClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm";
const buttonClass = "rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800";

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
    .select("id, chain_id, title, prompt, position, output_type").eq("chain_id", id)
    .order("position", { ascending: true }).order("id", { ascending: true });
  const orderedSteps = (steps ?? []) as Step[];
  const { data: runs, error: runsError } = await supabase.from("prompt_chain_runs")
    .select("id, status, input_text, input_image_name, input_image_path, step_results, final_output, error_message, created_at")
    .eq("chain_id", id).order("created_at", { ascending: false }).limit(20);

  // Signed URLs expire; create them on each server render for authorized admins.
  const allRuns = (runs ?? []) as Run[];
  const mediaPaths = [...new Set(allRuns.flatMap(run => [
    ...(run.input_image_path ? [run.input_image_path] : []),
    ...(run.step_results ?? []).flatMap(result => result.image_path ? [result.image_path] : []),
  ]))];
  const signedEntries = await Promise.all(mediaPaths.map(async path => {
    const { data } = await supabase.storage.from("prompt-chain-media")
      .createSignedUrl(path, 60 * 60);
    return [path, data?.signedUrl ?? ""] as const;
  }));
  const signedUrls = Object.fromEntries(signedEntries);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 backdrop-blur-xl sm:px-5">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><ArrowLeft size={16} /> Back to chains</Link>
        <span className="flex items-center gap-2 text-sm text-indigo-300"><Layers3 size={18} /> Prompt Chain Tool</span>
      </header>
      <section className="py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Chain editor</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em]">{(chain as Chain).name}</h1>
        <p className="mt-2 text-slate-400">Shape the prompts, choose each output, and control the execution order.</p>
        {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm">{error}</p> : null}

        <div className="app-panel mt-8 rounded-3xl p-6">
          <h2 className="font-semibold">Chain details</h2>
          <form action={updateChain} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="text-sm">Name<input className={inputClass} name="name" defaultValue={chain.name} maxLength={120} required /></label>
            <label className="text-sm">Description<textarea className={inputClass} name="description" defaultValue={chain.description} maxLength={1000} rows={2} /></label>
            <button type="submit" className="w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500">Save chain</button>
          </form>
          <form action={deleteChain} className="mt-5 border-t border-slate-800 pt-4">
            <input type="hidden" name="id" value={id} />
            <ConfirmSubmit message="Delete this chain, all of its steps, and its run history? This cannot be undone." className="flex items-center gap-2 text-sm text-rose-300 hover:text-rose-200"><Trash2 size={15} /> Delete chain and all its steps</ConfirmSubmit>
          </form>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Workflow</p><h2 className="mt-1 text-xl font-semibold">Steps ({orderedSteps.length})</h2></div>
          <span className="text-xs text-slate-400">Outputs flow top to bottom</span>
        </div>
        {stepsError ? <p role="alert" className="mt-4 text-sm text-rose-300">Could not load steps.</p> : null}
        <div className="mt-4 grid gap-4">
          {orderedSteps.map((step, index) => (
            <article key={step.id} className="app-panel relative overflow-hidden rounded-2xl p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-indigo-500/60">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-xs font-bold text-indigo-300">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-semibold">{step.title}</h3><p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">{step.output_type === "image" ? <ImageIcon size={12} /> : <Type size={12} />} {step.output_type === "image" ? "Image output" : "Text output"}</p></div></div>
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
                <label className="text-sm">Output type
                  <select className={inputClass} name="output_type" defaultValue={step.output_type ?? "text"}>
                    <option value="text">Text / captions</option>
                    <option value="image">Generated image</option>
                  </select>
                </label>
                <button type="submit" className="w-fit rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500">Save step</button>
              </form>
              <form action={deleteStep} className="mt-4">
                <input type="hidden" name="id" value={step.id} />
                <input type="hidden" name="chain_id" value={id} />
                <ConfirmSubmit message="Delete this prompt step? This cannot be undone." className="flex items-center gap-2 text-sm text-rose-300"><Trash2 size={14} /> Delete step</ConfirmSubmit>
              </form>
            </article>
          ))}
          {!stepsError && orderedSteps.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">No steps yet. Add your first prompt below.</p> : null}
        </div>

        <form action={addStep} className="app-panel mt-8 rounded-3xl border-dashed p-6">
          <input type="hidden" name="chain_id" value={id} />
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300"><Plus size={18} /></span><div><h2 className="font-semibold">Add another step</h2><p className="text-xs text-slate-400">It will be added to the end of the chain.</p></div></div>
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Title<input className={inputClass} name="title" placeholder="Summarize the input" maxLength={120} required /></label>
            <label className="text-sm">Prompt<textarea className={inputClass} name="prompt" placeholder="Describe the image in one sentence..." maxLength={10000} rows={4} required /></label>
            <label className="text-sm">Output type
              <select className={inputClass} name="output_type" defaultValue="text">
                <option value="text">Text / captions</option>
                <option value="image">Generated image</option>
              </select>
            </label>
          </div>
          <button type="submit" className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium hover:bg-indigo-500">Add step</button>
        </form>

        <section className="mt-12 rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 to-sky-500/5 p-6 shadow-2xl shadow-indigo-950/20">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white"><Play size={17} fill="currentColor" /></span><div><p className="flex items-center gap-1.5 text-xs font-medium text-indigo-300"><Sparkles size={12} /> AI execution</p><h2 className="text-xl font-semibold">Run this chain</h2></div></div>
          <p className="mt-2 text-sm text-slate-400">Gemini processes each prompt in order. The previous step&apos;s response becomes the next step&apos;s input.</p>
          <RunForm chainId={id} disabled={orderedSteps.length === 0} />
        </section>

        <section className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Archive</p>
          <h2 className="mt-1 text-xl font-semibold">Generated media and recent runs</h2>
          <p className="mt-2 text-sm text-slate-400">Only runs from this prompt chain appear here. Images are private and use time-limited URLs.</p>
          {runsError ? <p role="alert" className="mt-3 text-sm text-amber-300">Could not load run history. Apply the runs SQL migration first.</p> : null}
          <div className="mt-4 grid gap-4">
            {(runs as Run[] | null)?.map(run => (
              <article key={run.id} className="app-panel rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{new Date(run.created_at).toLocaleString()}</span>
                  <span className={run.status === "completed" ? "text-sm text-emerald-300" : run.status === "failed" ? "text-sm text-rose-300" : "text-sm text-amber-300"}>{run.status}</span>
                </div>
                {run.input_text ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-400">Input: {run.input_text}</p> : null}
                {run.input_image_name ? <p className="mt-2 text-xs text-slate-400">Input image: {run.input_image_name}</p> : null}
                {run.input_image_path && signedUrls[run.input_image_path] ?
                  <a href={signedUrls[run.input_image_path]} target="_blank" rel="noopener noreferrer">
                    <img src={signedUrls[run.input_image_path]} alt={run.input_image_name ?? "Uploaded input"} className="mt-3 max-h-60 rounded-lg border border-slate-700 object-contain" />
                  </a> : null}
                {run.step_results?.map((result, index) => (
                  <div key={result.step_id + index} className="mt-4 border-t border-slate-800 pt-4">
                    <h3 className="text-sm font-semibold text-indigo-300">Step {index + 1}: {result.title}</h3>
                    {result.output ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{result.output}</p> : null}
                    {result.image_path && signedUrls[result.image_path] ?
                      <a href={signedUrls[result.image_path]} target="_blank" rel="noopener noreferrer" title="View generated image">
                        <img src={signedUrls[result.image_path]} alt={`Generated media from step ${index + 1}`} className="mt-3 max-h-80 rounded-lg border border-slate-700 object-contain" />
                      </a> : null}
                  </div>
                ))}
                {run.status === "completed" && run.step_results?.length ?
                  <RunOutputActions chainName={chain.name} runId={run.id} results={run.step_results} />
                  : null}
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
