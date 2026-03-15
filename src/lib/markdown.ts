export interface ExperimentData {
  title: string;
  base: string;
  hardware: string;
  metric: string;
  before: number | null;
  after: number | null;
  delta: number | null;
  time: number;
  status: string;
  agent: string;
  verified: number;
  diff: string;
  context: string;
  raw: string;
}

export function parseExperimentMarkdown(md: string): ExperimentData {
  const lines = md.trim().split("\n");

  // Title: first line starting with #
  const titleLine = lines.find((l) => l.startsWith("# "));
  const title = titleLine ? titleLine.replace(/^#\s+/, "").trim() : "untitled";

  // Meta line
  const metaLine = lines.find((l) => l.startsWith("meta:"));
  const meta: Record<string, string> = {};
  if (metaLine) {
    const pairs = metaLine.replace(/^meta:\s*/, "").match(/\S+=\S+/g) || [];
    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx > 0) {
        meta[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }
    }
  }

  // Extract sections
  const diffMatch = md.match(/## diff\s*\n([\s\S]*?)(?=\n## |\n---|\n$|$)/i);
  const contextMatch = md.match(
    /## context\s*\n([\s\S]*?)(?=\n## |\n---|\n$|$)/i
  );

  const before = meta.before ? parseFloat(meta.before) : null;
  const after = meta.after ? parseFloat(meta.after) : null;
  const delta = meta.delta
    ? parseFloat(meta.delta.replace("%", ""))
    : before !== null && after !== null && before !== 0
      ? parseFloat((((after - before) / before) * 100).toFixed(4))
      : null;

  return {
    title,
    base: meta.base || "gpt2-124M",
    hardware: meta.hardware || "unknown",
    metric: meta.metric || "val_bpb",
    before,
    after,
    delta,
    time: meta.time ? parseInt(meta.time) : 300,
    status: meta.status || "keep",
    agent: meta.agent || "anonymous",
    verified: meta.verified ? parseInt(meta.verified) : 0,
    diff: diffMatch ? diffMatch[1].trim() : "",
    context: contextMatch ? contextMatch[1].trim() : "",
    raw: md.trim(),
  };
}

export function experimentToMarkdown(exp: {
  title: string;
  base?: string;
  hardware?: string;
  metric?: string;
  before_val?: number | null;
  after_val?: number | null;
  delta_pct?: number | null;
  time_secs?: number;
  status?: string;
  agent_name?: string;
  verified?: number;
  diff?: string;
  context?: string;
}): string {
  const meta = [
    `base=${exp.base || "gpt2-124M"}`,
    `hardware=${exp.hardware || "unknown"}`,
    `metric=${exp.metric || "val_bpb"}`,
    exp.before_val !== null && exp.before_val !== undefined
      ? `before=${exp.before_val}`
      : null,
    exp.after_val !== null && exp.after_val !== undefined
      ? `after=${exp.after_val}`
      : null,
    exp.delta_pct !== null && exp.delta_pct !== undefined
      ? `delta=${exp.delta_pct}%`
      : null,
    `time=${exp.time_secs || 300}`,
    `status=${exp.status || "keep"}`,
    `agent=${exp.agent_name || "anonymous"}`,
    `verified=${exp.verified || 0}`,
  ]
    .filter(Boolean)
    .join(" ");

  let md = `# ${exp.title}\nmeta: ${meta}\n`;
  if (exp.diff) md += `\n## diff\n${exp.diff}\n`;
  if (exp.context) md += `\n## context\n${exp.context}\n`;
  return md;
}

export function parseTsvBulk(tsv: string): ExperimentData[] {
  const lines = tsv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t");
  const results: ExperimentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (cols.length < 2) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] || "").trim();
    });

    const before = row.before ? parseFloat(row.before) : null;
    const after = row.after ? parseFloat(row.after) : null;
    const delta = row.delta
      ? parseFloat(row.delta.replace("%", ""))
      : before !== null && after !== null && before !== 0
        ? parseFloat((((after - before) / before) * 100).toFixed(4))
        : null;

    results.push({
      title: row.title || row.name || "untitled",
      base: row.base || "gpt2-124M",
      hardware: row.hardware || "unknown",
      metric: row.metric || "val_bpb",
      before,
      after,
      delta,
      time: row.time ? parseInt(row.time) : 300,
      status: row.status || "keep",
      agent: row.agent || "anonymous",
      verified: row.verified ? parseInt(row.verified) : 0,
      diff: row.diff || "",
      context: row.context || "",
      raw: "",
    });
  }

  return results;
}
