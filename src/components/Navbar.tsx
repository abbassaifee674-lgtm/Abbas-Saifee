"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plane, Search, Settings, FileText, CheckCircle2, Moon, Sun, AlertCircle } from "lucide-react";

interface NavbarProps {
  isEveningMode?: boolean;
  onToggleEveningMode?: () => void;
  onFindJobsNow?: () => void;
  isFindingJobs?: boolean;
  allowedEmail?: string;
}

export function Navbar({
  isEveningMode = false,
  onToggleEveningMode,
  onFindJobsNow,
  isFindingJobs = false,
  allowedEmail = "abbassaifee674@gmail.com",
}: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Plane className="h-5 w-5 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">JobPilot</span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
                  Abbas Saifee
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Autonomous Procurement Outreach</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-slate-800/80 text-white border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/follow-up"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/follow-up"
                  ? "bg-slate-800/80 text-white border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Follow-ups
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-slate-800/80 text-white border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Settings & CV
            </Link>
            <Link
              href="/logs"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/logs"
                  ? "bg-slate-800/80 text-white border border-slate-700/60"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              Audit Logs
            </Link>
          </nav>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-3">
          {/* Evening Review Mode Toggle */}
          {onToggleEveningMode && (
            <button
              onClick={onToggleEveningMode}
              type="button"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isEveningMode
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
              title="Focus exclusively on today's new leads ready for review"
            >
              {isEveningMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-slate-400" />}
              <span className="hidden sm:inline">Evening Mode</span>
              {isEveningMode && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
            </button>
          )}

          {/* Find Jobs Now Button */}
          {onFindJobsNow && (
            <button
              onClick={onFindJobsNow}
              disabled={isFindingJobs}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/20"
            >
              <Search className={`h-3.5 w-3.5 ${isFindingJobs ? "animate-spin" : ""}`} />
              <span>{isFindingJobs ? "Hunting Jobs..." : "Find Jobs Now"}</span>
            </button>
          )}

          {/* Abbas User Badge */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-xs text-slate-400">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-slate-300">{allowedEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
