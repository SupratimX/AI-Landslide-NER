"use client";

import type { Lang } from "@/types";

interface Props {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  clock: string;
}

export default function Topbar({ lang, onLangChange, clock }: Props) {
  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <span className="bg-danger text-white font-mono text-[11px] font-semibold px-2 py-1 rounded tracking-wider">
          NDRF
        </span>
        <h1 className="text-[15px] font-semibold text-[#e8f4ff]">
          NER Landslide Early Warning System
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="live-pulse flex items-center gap-2 font-mono text-[11px] text-normal">
          LIVE
        </div>
        <span className="font-mono text-xs text-muted">{clock}</span>

        {(["en", "as", "hi"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => onLangChange(l)}
            className={`text-xs px-2.5 py-1 rounded border transition-colors ${
              lang === l
                ? "border-accent text-accent bg-card"
                : "border-border text-text bg-card hover:border-muted"
            }`}
          >
            {l === "en" ? "EN" : l === "as" ? "অসমীয়া" : "हिंदी"}
          </button>
        ))}
      </div>
    </header>
  );
}
