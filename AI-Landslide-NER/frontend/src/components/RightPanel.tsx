"use client";

import type { Zone, AlertItem, FieldReport, Lang } from "@/types";
import RiskCard from "./RiskCard";
import ForecastChart from "./ForecastChart";

interface Props {
  zone: Zone | null;
  alerts: AlertItem[];
  reports: FieldReport[];
  lang: Lang;
}

export default function RightPanel({ zone, alerts, reports, lang }: Props) {
  return (
    <aside className="w-[300px] bg-surface border-l border-border overflow-y-auto p-4 flex flex-col gap-4 shrink-0">
      {/* Risk score */}
      <div>
        <div className="font-mono text-[10px] text-muted tracking-widest mb-2.5">
          RISK SCORE — SELECTED ZONE
        </div>
        <RiskCard zone={zone} />
      </div>

      {/* Forecast */}
      <div>
        <div className="font-mono text-[10px] text-muted tracking-widest mb-2.5">
          24-HOUR RISK FORECAST
        </div>
        <ForecastChart baseScore={zone?.score ?? 50} />
      </div>

      {/* Weather */}
      {zone && (
        <div>
          <div className="font-mono text-[10px] text-muted tracking-widest mb-2.5">
            WEATHER — LIVE
          </div>
          <div className="bg-card border border-border rounded-lg p-3 space-y-0">
            {[
              { lbl: "Rainfall (24h)", val: `${zone.rainfall} mm`, color: "text-accent" },
              {
                lbl: "Rainfall (48h)",
                val: `${Math.round(zone.rainfall * 1.5)} mm`,
                color: "text-accent",
              },
              { lbl: "Soil moisture", val: `${zone.moisture}%`, color: "" },
              { lbl: "Slope", val: `${zone.slope}°`, color: "" },
              { lbl: "Elevation", val: `${zone.elevation} m`, color: "" },
            ].map((row) => (
              <div
                key={row.lbl}
                className="flex justify-between items-center py-1.5 border-b border-border last:border-0 text-xs"
              >
                <span className="text-muted">{row.lbl}</span>
                <span className={`font-mono font-semibold ${row.color}`}>
                  {row.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      <div>
        <div className="font-mono text-[10px] text-muted tracking-widest mb-2.5">
          ALERT LOG
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          {alerts.length === 0 && (
            <div className="text-xs text-muted">No alerts yet</div>
          )}
          {alerts.slice(0, 8).map((a, i) => (
            <div
              key={i}
              className="py-2 border-b border-border last:border-0 text-xs"
            >
              <div className="font-mono text-[10px] text-muted">{a.time}</div>
              <div className="mt-0.5 leading-snug">
                {a.sms?.[lang] || a.sms?.en || `${a.level} at ${a.zone}`}
              </div>
              <span className="inline-block text-[10px] text-accent mt-1">
                {lang.toUpperCase()} • SMS sent
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Field reports */}
      <div>
        <div className="font-mono text-[10px] text-muted tracking-widest mb-2.5">
          FIELD REPORTS
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          {reports.length === 0 && (
            <div className="text-xs text-muted">No reports</div>
          )}
          {reports.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="flex gap-2.5 py-2 border-b border-border last:border-0"
            >
              <div className="w-12 h-12 rounded bg-border flex items-center justify-center text-xl shrink-0">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{r.type}</div>
                <div className="text-[11px] text-muted mt-0.5">📍 {r.loc}</div>
                <div className="font-mono text-[10px] text-muted">{r.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
