"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { RunLog } from "../../types";
import { ALLOWED_EMAIL } from "../../lib/constants/defaults";
import { Activity, Clock, CheckCircle2, AlertTriangle, Layers, RefreshCw } from "lucide-react";

export default function LogsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/logs", {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || "Could not load run logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar allowedEmail={ALLOWED_EMAIL} />

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="border-b border-slate-800 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-indigo-400" />
              Job Hunter Audit Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Execution history of automatic cron and manual &quot;Find Jobs&quot; hunter cycles — stored in Firestore.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center py-16 text-slate-400">
            <Activity className="h-8 w-8 mx-auto mb-3 animate-pulse text-indigo-400" />
            <p className="text-sm">Loading run logs from Firestore…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-800/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-400">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-400">No runs yet.</p>
            <p className="text-xs mt-1">Use &quot;Find Jobs Now&quot; on the dashboard to trigger the first run.</p>
          </div>
        )}

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

              {log.errors && log.errors.length > 0 && (
                <div className="rounded-lg bg-rose-500/5 border border-rose-800/30 px-3 py-2 text-xs text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5" />
                  {log.errors.join(" · ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
