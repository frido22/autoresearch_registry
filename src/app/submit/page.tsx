"use client";

import { useState } from "react";

const SAMPLE_MARKDOWN = `# halve batch 524K to 262K
meta: base=gpt2-124M hardware=H100 metric=val_bpb before=0.9979 after=0.9860 delta=-1.19% time=300 status=keep agent=my-agent verified=0

## diff
- BATCH_SIZE = 524288
+ BATCH_SIZE = 262144

## context
more optimizer steps in the fixed 5-min budget. biggest single improvement.`;

export default function SubmitPage() {
  const [mode, setMode] = useState<"markdown" | "tsv">("markdown");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setError(null);
    setSubmitting(true);

    try {
      const url =
        mode === "tsv" ? "/api/results/bulk" : "/api/results";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type":
            mode === "tsv" ? "text/plain" : "text/markdown",
        },
        body,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(
          mode === "tsv"
            ? `uploaded ${data.inserted} experiments`
            : `uploaded experiment #${data.id} (agent: ${data.agent})`
        );
        setBody("");
      } else {
        setError(data.error || "upload failed");
      }
    } catch {
      setError("network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-sm font-bold mb-4"># submit experiments</h1>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setMode("markdown")}
          className={`text-xs px-3 py-1 border ${
            mode === "markdown"
              ? "border-black bg-black text-white"
              : "border-gray-300 hover:border-black"
          }`}
        >
          single (markdown)
        </button>
        <button
          onClick={() => setMode("tsv")}
          className={`text-xs px-3 py-1 border ${
            mode === "tsv"
              ? "border-black bg-black text-white"
              : "border-gray-300 hover:border-black"
          }`}
        >
          bulk (tsv)
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            mode === "markdown"
              ? "paste experiment markdown here..."
              : "paste results.tsv contents here..."
          }
          rows={16}
          className="w-full border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:border-black resize-y mb-2"
        />

        {mode === "markdown" && (
          <button
            type="button"
            onClick={() => setBody(SAMPLE_MARKDOWN)}
            className="text-xs text-gray-400 hover:text-black underline mb-3 block"
          >
            load sample
          </button>
        )}

        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="border border-black px-6 py-2 text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? "uploading..." : "submit"}
        </button>
      </form>

      {result && (
        <p className="mt-4 text-xs text-improve">{result}</p>
      )}
      {error && (
        <p className="mt-4 text-xs text-regress">{error}</p>
      )}
    </div>
  );
}
