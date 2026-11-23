"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { ALLOWED_EMAIL } from "../../lib/constants/defaults";
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  Clock,
  Sparkles
} from "lucide-react";

interface ServiceHealth {
  name: string;
  status: "healthy" | "unhealthy" | "optional_missing";
  latencyMs: number;
  message: string;
  fixHint?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded";
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export default function StatusPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ message: string; success: boolean } | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/status/health", {
        headers: { "x-demo-user": "abbas" },
      });
      const data = await res.json();
      setHealthData(data);
    } catch (err: any) {
      console.error("Health fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/status/test-email", {
        method: "POST",
        headers: { "x-demo-user": "abbas" },
      });
      const data = await res.json();

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Success! Test email with CV PDF attached sent to ${ALLOWED_EMAIL}. Message ID: ${data.messageId}`,
        });
      } else {
        throw new Error(data.error || "Failed to send test email");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const getStatusBadge = (service: ServiceHealth) => {
    if (service.status === "healthy") {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Operational</span>
        </span>
      );
    }
    if (service.status === "optional_missing") {
      return (
        <span className="flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-700">
          <span>Optional / Skipped</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
        <XCircle className="h-3.5 w-3.5" />
        <span>Failed / Attention</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar allowedEmail={ALLOWED_EMAIL} />

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400">
                <Activity className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Connection Status</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live health monitor verifying authentic integrations with Firebase, Gemini AI, job search APIs, and Gmail.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHealth}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Running Checks..." : "Re-run Checks"}</span>
            </button>

            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Send className={`h-3.5 w-3.5 ${isSendingTest ? "animate-spin" : ""}`} />
              <span>{isSendingTest ? "Sending..." : "Send Test Email to Myself"}</span>
            </button>
          </div>
        </div>

        {/* Test Email Result Banner */}
        {testResult && (
          <div
            className={`flex items-start gap-3 rounded-xl p-4 text-xs font-medium border ${
              testResult.success
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">{testResult.success ? "Test Dispatch Succeeded" : "Test Dispatch Failed"}</div>
              <div className="mt-0.5">{testResult.message}</div>
            </div>
          </div>
        )}

        {/* Global System Banner */}
        {healthData && (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Overall System Health:</span>
              <span
                className={`font-bold uppercase tracking-wider ${
                  healthData.status === "healthy" ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {healthData.status === "healthy" ? "All Core Systems Operational" : "Action Required on Highlighted Services"}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Last check: {new Date(healthData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="space-y-3">
          {isLoading && !healthData ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
              <span>Executing live minimal health requests against all APIs...</span>
            </div>
          ) : healthData ? (
            Object.entries(healthData.services).map(([key, service]) => (
              <div
                key={key}
                className="glass-panel rounded-xl p-4 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-white">{service.name}</span>
                    {service.latencyMs > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {service.latencyMs}ms
                      </span>
                    )}
                  </div>
                  {getStatusBadge(service)}
                </div>

                <div className="text-xs text-slate-300">{service.message}</div>

                {service.fixHint && service.status === "unhealthy" && (
                  <div className="mt-2 rounded-lg bg-rose-950/20 border border-rose-500/20 p-2.5 text-[11px] text-rose-300">
                    <span className="font-semibold text-rose-200">How to fix:</span> {service.fixHint}
                  </div>
                )}
              </div>
            ))
          ) : null}
        </div>
      </main>
    </div>
  );
}
