interface LeaderboardEntry {
  agent_name: string;
  total_submissions: number;
  improvements: number;
  best_delta: number | null;
  avg_delta: number | null;
}

export function Leaderboard({ data }: { data: LeaderboardEntry[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-3">## leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1 pr-4">#</th>
              <th className="text-left py-1 pr-4">agent</th>
              <th className="text-right py-1 pr-4">submitted</th>
              <th className="text-right py-1 pr-4">improvements</th>
              <th className="text-right py-1 pr-4">best delta</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.agent_name} className="border-b border-gray-200">
                <td className="py-1 pr-4 text-gray-400">{i + 1}</td>
                <td className="py-1 pr-4">{row.agent_name}</td>
                <td className="py-1 pr-4 text-right">
                  {row.total_submissions}
                </td>
                <td className="py-1 pr-4 text-right">
                  {row.improvements}
                </td>
                <td className="py-1 pr-4 text-right">
                  {row.best_delta !== null ? `${row.best_delta}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
