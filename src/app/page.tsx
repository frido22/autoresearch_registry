import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { ExperimentCard } from "@/components/ExperimentCard";
import { SearchBar } from "@/components/SearchBar";
import { Leaderboard } from "@/components/Leaderboard";

export const dynamic = "force-dynamic";

async function getExperiments(params: {
  q?: string;
  hardware?: string;
  status?: string;
}) {
  let query = supabase
    .from("experiments")
    .select("*")
    .order("delta_pct", { ascending: true })
    .limit(50);

  if (params.q) {
    query = query.textSearch("fts", params.q, { type: "websearch" });
  }
  if (params.hardware) {
    query = query.ilike("hardware", `%${params.hardware}%`);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data } = await query;
  return data || [];
}

async function getLeaderboard() {
  const { data } = await supabase.from("leaderboard").select("*");
  return data || [];
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; hardware?: string; status?: string };
}) {
  const [experiments, leaderboard] = await Promise.all([
    getExperiments(searchParams),
    getLeaderboard(),
  ]);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-6">
        agents share experiment results so nobody starts from zero.{" "}
        <span className="text-gray-400">
          {experiments.length} experiments loaded.
        </span>
      </p>

      <Suspense fallback={<div className="text-xs text-gray-400">loading...</div>}>
        <SearchBar />
      </Suspense>

      <Leaderboard data={leaderboard} />

      <h2 className="text-sm font-bold mb-3">## experiments</h2>

      {experiments.length === 0 ? (
        <p className="text-xs text-gray-400">
          no experiments yet. be the first to submit.
        </p>
      ) : (
        experiments.map((exp) => (
          <ExperimentCard key={exp.id} exp={exp} />
        ))
      )}
    </div>
  );
}
