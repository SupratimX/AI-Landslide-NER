"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import RightPanel from "@/components/RightPanel";
import {
  getDashboard,
  getAlerts,
  getReports,
  getRoads,
} from "@/lib/api";
import type { Zone, AlertItem, FieldReport, Road, Lang } from "@/types";

// Leaflet must be client-only
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-bg text-muted text-sm">
      Loading map…
    </div>
  ),
});

export default function DashboardPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selected, setSelected] = useState<Zone | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [reports, setReports] = useState<FieldReport[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [lang, setLang] = useState<Lang>("en");
  const [clock, setClock] = useState("--:--:--");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [z, a, r, rd] = await Promise.all([
        getDashboard(),
        getAlerts(),
        getReports(),
        getRoads(),
      ]);
      setZones(z);
      setAlerts(a);
      setReports(r);
      setRoads(rd);
      setError(null);

      // Keep selection or default to highest risk
      setSelected((prev) => {
        if (prev) {
          const updated = z.find((x) => x.id === prev.id);
          return updated || z[0] || null;
        }
        return z[0] || null;
      });
    } catch (e) {
      console.error(e);
      setError(
        "Backend not reachable. Start Python API on port 8000 (see README)."
      );
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", { hour12: false })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar lang={lang} onLangChange={setLang} clock={clock} />

      {error && (
        <div className="bg-danger/20 text-danger text-xs px-4 py-2 border-b border-danger/40 text-center">
          {error}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <Sidebar
          zones={zones}
          selected={selected}
          onSelect={setSelected}
          roads={roads}
        />

        <main className="flex-1 flex flex-col min-w-0">
          <div className="bg-surface border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-medium">
              GIS Risk Heatmap — North Eastern Region
            </span>
            <div className="flex gap-2">
              {["Risk Zones", "Roads", "Field Reports"].map((label, i) => (
                <button
                  key={label}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                    i === 0
                      ? "border-accent text-accent bg-card"
                      : "border-border text-text bg-card hover:border-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <MapView zones={zones} selected={selected} onSelect={setSelected} />
        </main>

        <RightPanel
          zone={selected}
          alerts={alerts}
          reports={reports}
          lang={lang}
        />
      </div>
    </div>
  );
}
