"use client";

import { Sparkles, RefreshCw, Info } from "lucide-react";

interface SeedBannerProps {
  onResetSeed: () => void;
  isResetting?: boolean;
}

export function SeedBanner({ onResetSeed, isResetting = false }: SeedBannerProps) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-indigo-950/30 px-4 py-3 text-xs backdrop-blur-md">
      <div className="flex items-center gap-2.5 text-indigo-200">
        <div className="rounded-full bg-indigo-500/20 p-1 text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-white">Demonstration & Ready Mode:</span> Pre-loaded with high-match
          procurement leads tailored to Abbas Saifee across Luxembourg, Austria, Singapore, Germany & Australia.
        </div>
      </div>
      <button
        onClick={onResetSeed}
        disabled={isResetting}
        type="button"
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 font-medium text-indigo-300 hover:bg-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${isResetting ? "animate-spin" : ""}`} />
        <span>{isResetting ? "Resetting..." : "Reset Sample Leads"}</span>
      </button>
    </div>
  );
}
