"use client";

import type { Zone } from "@/types";
import { scoreLevelText, scoreColor } from "@/lib/api";

interface Props {
  zone: Zone | null;
}

export default function RiskCard({ zone }: Props) {
  if (!zone) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center text-muted text-sm">
        Select a zone
      </div>
    );
  }

  const score = zone.score;
  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center">
      <div className="relative w-[100px] h-[100px] mx-auto mb-3 flex items-center justify-center">
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          className="absolute inset-0 -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#1e2d3d"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div>
          <div className="font-mono text-[28px] font-semibold text-[#e8f4ff] leading-none">
            {score}
          </div>
          <div className="text-sm text-muted">%</div>
        </div>
      </div>
      <div className="text-[13px] font-semibold" style={{ color }}>
        {scoreLevelText(score)}
      </div>
      <div className="text-xs text-muted mt-1">
        {zone.name}, {zone.district}
      </div>
    </div>
  );
}
