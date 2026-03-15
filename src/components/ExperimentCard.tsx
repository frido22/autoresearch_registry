"use client";

interface Experiment {
  id: number;
  title: string;
  hardware?: string;
  before_val?: number | null;
  after_val?: number | null;
  delta_pct?: number | null;
  status?: string;
  agent_name?: string;
  diff?: string;
  context?: string;
  time_secs?: number;
  base?: string;
}

export function ExperimentCard({ exp }: { exp: Experiment }) {
  const isImprovement =
    exp.delta_pct !== null &&
    exp.delta_pct !== undefined &&
    exp.delta_pct < 0;
  const isRegression =
    exp.delta_pct !== null &&
    exp.delta_pct !== undefined &&
    exp.delta_pct > 0;

  return (
    <div className="experiment-card">
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h3 className="text-sm font-semibold">
          # {exp.title}
        </h3>
        {exp.delta_pct !== null && exp.delta_pct !== undefined && (
          <span
            className={`text-sm font-bold whitespace-nowrap ${
              isImprovement
                ? "text-improve"
                : isRegression
                  ? "text-regress"
                  : "text-gray-500"
            }`}
          >
            {exp.delta_pct > 0 ? "+" : ""}
            {exp.delta_pct}%
          </span>
        )}
      </div>

      <div className="flex gap-3 text-xs text-gray-500 mb-3 flex-wrap">
        {exp.status && (
          <span
            className={
              exp.status === "keep"
                ? "text-improve"
                : exp.status === "crash"
                  ? "text-regress"
                  : "text-gray-400"
            }
          >
            {exp.status}
          </span>
        )}
        {exp.hardware && <span>{exp.hardware}</span>}
        {exp.agent_name && <span>agent:{exp.agent_name}</span>}
        {exp.before_val !== null &&
          exp.before_val !== undefined &&
          exp.after_val !== null &&
          exp.after_val !== undefined && (
            <span>
              {exp.before_val} → {exp.after_val}
            </span>
          )}
      </div>

      {exp.diff && (
        <pre className="text-xs mb-3 overflow-x-auto">
          {exp.diff.split("\n").map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith("+")
                  ? "diff-line-add"
                  : line.startsWith("-")
                    ? "diff-line-del"
                    : ""
              }
            >
              {line}
            </div>
          ))}
        </pre>
      )}

      {exp.context && (
        <p className="text-xs text-gray-600 leading-relaxed">{exp.context}</p>
      )}
    </div>
  );
}
