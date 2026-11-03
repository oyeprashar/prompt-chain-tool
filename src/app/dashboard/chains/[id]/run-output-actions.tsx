"use client";

import { useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";

type Result = { title: string; output: string; image_path?: string };

export function RunOutputActions({
  chainName, runId, results,
}: {
  chainName: string;
  runId: string;
  results: Result[];
}) {
  const [copied, setCopied] = useState(false);
  const text = results.map((item, index) =>
    `Step ${index + 1}: ${item.title}\n${item.output || (item.image_path ? "[Generated image]" : "")}`
  ).join("\n\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chainName.replace(/[^a-z0-9-]/gi, "-").slice(0, 40)}-${runId.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <button type="button" onClick={copy}
        className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800">
        <ClipboardCopy size={14} /> {copied ? "Copied" : "Copy text outputs"}
      </button>
      <button type="button" onClick={download}
        className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs hover:bg-slate-800">
        <Download size={14} /> Download text outputs
      </button>
    </div>
  );
}
