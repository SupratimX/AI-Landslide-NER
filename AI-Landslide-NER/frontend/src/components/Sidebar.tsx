"use client";

import type { Zone, Road } from "@/types";
import { scoreClass } from "@/lib/api";

interface Props {
  zones: Zone[];
  selected: Zone | null;
  onSelect: (z: Zone) => void;
  roads: Road[];
}

export default function Sidebar({ zones, selected, onSelect, roads }: Props) {
  const statusColor: Record<string, string> = {
    BLOCKED: "text-danger",
    RISK: "text-high",
    CLEAR: "text-normal",
  };
  const statusIcon: Record<string, string> = {
    BLOCKED: "🔴",
    RISK: "🟠",
    CLEAR: "🟢",
  };

  return (
    <aside className="w-[260px] bg-surface border-r border-border overflow-y-auto p-4 shrink-0">
      {/* Zones */}
      <section className="mb-6">
        <div className="font-mono text-[10px] text-muted tracking-widest border-b border-border pb-1.5 mb-2.5">
          MONITORED ZONES
        </div>
        <div className="space-y-1.5">
          {[...zones]
            .sort((a, b) => b.score - a.score)
            .map((z) => (
              <button
                key={z.id}
                onClick={() => onSelect(z)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md border transition-colors text-left ${
                  selected?.id === z.id
                    ? "border-accent bg-accent/5"
                    : "border-transparent hover:border-border"
                }`}
              >
                <div>
                  <div className="text-[13px] font-medium">{z.name}</div>
                  <div className="text-[11px] text-muted mt-0.5">{z.district}</div>
                </div>
                <span
                  className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded badge-${scoreClass(z.score)}`}
                  style={{
                    background:
                      z.score >= 80
                        ? "rgba(255,59,59,0.15)"
                        : z.score >= 70
                        ? "rgba(255,140,0,0.15)"
                        : z.score >= 50
                        ? "rgba(245,196,0,0.15)"
                        : "rgba(46,204,113,0.15)",
                    color:
                      z.score >= 80
                        ? "#ff3b3b"
                        : z.score >= 70
                        ? "#ff8c00"
                        : z.score >= 50
                        ? "#f5c400"
                        : "#2ecc71",
                  }}
                >
                  {z.score}%
                </span>
              </button>
            ))}
        </div>
      </section>

      {/* Sensors */}
      {selected && (
        <section className="mb-6">
          <div className="font-mono text-[10px] text-muted tracking-widest border-b border-border pb-1.5 mb-2.5">
            LIVE SENSORS — {selected.name}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { val: selected.rainfall, unit: "mm/24h", lbl: "Rainfall" },
              { val: selected.moisture, unit: "%", lbl: "Soil moisture" },
              { val: selected.slope, unit: "°", lbl: "Slope angle" },
              { val: selected.elevation, unit: "m", lbl: "Elevation" },
            ].map((s) => (
              <div
                key={s.lbl}
                className="bg-card border border-border rounded-md p-2.5"
              >
                <div className="font-mono text-lg font-semibold text-[#e8f4ff] leading-none">
                  {s.val}
                </div>
                <div className="text-[10px] text-muted">{s.unit}</div>
                <div className="text-[11px] text-muted mt-1">{s.lbl}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Roads */}
      <section>
        <div className="font-mono text-[10px] text-muted tracking-widest border-b border-border pb-1.5 mb-2.5">
          ROAD STATUS
        </div>
        <div className="space-y-0">
          {roads.map((r) => (
            <div
              key={r.name}
              className="py-2 border-b border-border last:border-0 text-xs"
            >
              <div className="font-medium">{r.name}</div>
              <div
                className={`font-mono text-[11px] mt-0.5 ${statusColor[r.status]}`}
              >
                {statusIcon[r.status]} {r.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
