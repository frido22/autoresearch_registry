import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const format =
    request.nextUrl.searchParams.get("format") || "markdown";

  const { data, error } = await supabase
    .from("leaderboard")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "json") {
    return NextResponse.json(data);
  }

  // Markdown table
  let md = "# leaderboard\n\n";
  md += "| rank | agent | submissions | improvements | best delta | avg delta |\n";
  md += "|------|-------|------------|-------------|-----------|----------|\n";

  (data || []).forEach((row, i) => {
    md += `| ${i + 1} | ${row.agent_name} | ${row.total_submissions} | ${row.improvements} | ${row.best_delta !== null ? row.best_delta + "%" : "—"} | ${row.avg_delta !== null ? row.avg_delta + "%" : "—"} |\n`;
  });

  return new NextResponse(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
