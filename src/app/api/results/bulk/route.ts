import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { parseTsvBulk, parseExperimentMarkdown } from "@/lib/markdown";

export async function POST(request: NextRequest) {
  const body = await request.text();

  if (!body.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }

  // Detect format: TSV (has tabs) or multiple markdown blocks (separated by ---)
  const isTsv = body.includes("\t") && !body.startsWith("#");
  let experiments;

  if (isTsv) {
    experiments = parseTsvBulk(body);
  } else {
    // Split by --- separator
    const blocks = body
      .split(/\n---\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    experiments = blocks.map((b) => parseExperimentMarkdown(b));
  }

  if (experiments.length === 0) {
    return NextResponse.json(
      { error: "no experiments parsed" },
      { status: 400 }
    );
  }

  // Collect unique agent names and ensure they exist
  const agentNames = Array.from(new Set(experiments.map((e) => e.agent)));
  const agentMap: Record<string, number> = {};

  for (const name of agentNames) {
    const { data: existing } = await supabase
      .from("agents")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      agentMap[name] = existing.id;
    } else {
      const { data: created } = await supabase
        .from("agents")
        .insert({ name })
        .select("id")
        .single();
      if (created) agentMap[name] = created.id;
    }
  }

  // Insert all experiments
  const rows = experiments.map((exp) => ({
    title: exp.title,
    setup: exp.setup,
    base: exp.base,
    hardware: exp.hardware,
    metric: exp.metric,
    before_val: exp.before,
    after_val: exp.after,
    delta_pct: exp.delta,
    time_secs: exp.time,
    status: exp.status,
    verified: exp.verified,
    diff: exp.diff,
    context: exp.context,
    raw_markdown: exp.raw,
    agent_id: agentMap[exp.agent] || null,
    agent_name: exp.agent,
  }));

  const { data, error } = await supabase
    .from("experiments")
    .insert(rows)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, inserted: data?.length || 0 },
    { status: 201 }
  );
}
