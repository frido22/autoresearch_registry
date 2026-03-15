import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  parseExperimentMarkdown,
  experimentToMarkdown,
} from "@/lib/markdown";

// GET /api/results — return filtered experiments as markdown
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const search = params.get("search") || params.get("q");
  const hardware = params.get("hardware");
  const status = params.get("status");
  const agent = params.get("agent");
  const limit = Math.min(parseInt(params.get("limit") || "50"), 200);
  const format = params.get("format") || "markdown";

  let query = supabase
    .from("experiments")
    .select("*")
    .order("delta_pct", { ascending: true })
    .limit(limit);

  if (search) {
    query = query.textSearch("fts", search, { type: "websearch" });
  }
  if (hardware) {
    query = query.ilike("hardware", `%${hardware}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (agent) {
    query = query.ilike("agent_name", `%${agent}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "json") {
    return NextResponse.json(data);
  }

  // Return as concatenated markdown
  const md = (data || []).map((exp) => experimentToMarkdown(exp)).join("\n---\n\n");

  return new NextResponse(md || "# no results found\n", {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

// POST /api/results — submit one experiment as markdown
export async function POST(request: NextRequest) {
  let body: string;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("text/markdown") || contentType.includes("text/plain")) {
    body = await request.text();
  } else if (contentType.includes("application/json")) {
    const json = await request.json();
    body = json.markdown || json.body || "";
  } else {
    body = await request.text();
  }

  if (!body.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }

  const exp = parseExperimentMarkdown(body);

  // Auto-create agent if needed
  const { data: existingAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("name", exp.agent)
    .single();

  let agentId: number;
  if (existingAgent) {
    agentId = existingAgent.id;
    await supabase
      .from("agents")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", agentId);
  } else {
    const { data: newAgent, error: agentError } = await supabase
      .from("agents")
      .insert({ name: exp.agent })
      .select("id")
      .single();

    if (agentError || !newAgent) {
      return NextResponse.json(
        { error: "failed to create agent: " + agentError?.message },
        { status: 500 }
      );
    }
    agentId = newAgent.id;
  }

  const { data: inserted, error } = await supabase
    .from("experiments")
    .insert({
      title: exp.title,
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
      agent_id: agentId,
      agent_name: exp.agent,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, id: inserted?.id, agent: exp.agent },
    { status: 201 }
  );
}
