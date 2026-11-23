"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { RunLog } from "@/types";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { Activity, Clock, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);

  useEffect(() => {
    // In mock store, seed initial run log is available
    const initialLogs: RunLog[] = [
      {
        id: "log_initial_seed",
        timestamp: new Date().toISOString(),
        trigger: "manual",
        sourcesQueried: ["Adzuna", "Arbeitnow", "Jooble", "The Muse"],
        jobsFetched: 38,
        jobsQualified: 6,
        jobsSaved: 6,
        errors: [],
        status: "success",
      },
    ];
    setLogs(initialLogs);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar allowedEmail={ALLOWED_EMAIL} />

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-400" />
            Job Hunter Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete execution history of automatic Vercel Cron and manual "Find Jobs" hunter cycles.
          </p>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                      log.status === "success"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {log.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">Trigger: {log.trigger}</span>
                </div>
                <span className="font-mono text-xs text-slate-400">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block">Jobs Fetched</span>
                  <span className="font-bold text-white text-base">{log.jobsFetched}</span>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block">Qualified (≥ 60%)</span>
                  <span className="font-bold text-indigo-400 text-base">{log.jobsQualified}</span>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
                  <span className="text-slate-500 block">Saved to Dashboard</span>
                  <span className="font-bold text-emerald-400 text-base">{log.jobsSaved}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                <span>Sources queried: </span>
                <span className="text-slate-300 font-medium">{log.sourcesQueried.join(", ")}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
