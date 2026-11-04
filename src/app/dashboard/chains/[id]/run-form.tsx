"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RunForm({ chainId, disabled }: { chainId: string; disabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/chains/${chainId}/run`, { method: "POST", body: form });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not run chain");
      setSuccess("Run completed. See the newest results under Generated media and recent runs.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={run} className="mt-4 grid gap-4">
      <label className="text-sm">Starting input (optional if uploading an image)
        <textarea name="input" rows={3} maxLength={10000} placeholder="Describe what you want the chain to work on..." className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5" />
      </label>
      <label className="text-sm">Image input (optional, first step only)
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm text-slate-300" />
        <span className="mt-1 block text-xs text-slate-400">JPG, PNG or WebP, up to 3 MB. The image is sent to Gemini and saved to private Supabase Storage.</span>
      </label>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      {success ? <p role="status" className="text-sm text-emerald-300">{success}</p> : null}
      <button disabled={disabled || loading} type="submit" className="w-fit rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "Running chain..." : "Run chain"}
      </button>
      {loading ? <p role="status" className="text-xs text-slate-400">Running each step in order. Keep this page open until the request finishes.</p> : null}
    </form>
  );
}
