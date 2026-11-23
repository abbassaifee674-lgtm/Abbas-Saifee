import { Sparkles, Send, CheckCircle2, MessageSquare, Gauge } from "lucide-react";

interface StatsOverviewProps {
  newLeadsCount: number;
  sentTodayCount: number;
  totalSentCount: number;
  repliesCount: number;
  dailySends: number;
  dailyQuota: number;
}

export function StatsOverview({
  newLeadsCount,
  sentTodayCount,
  totalSentCount,
  repliesCount,
  dailySends,
  dailyQuota,
}: StatsOverviewProps) {
  const quotaLeft = Math.max(0, dailyQuota - dailySends);
  const quotaPercent = Math.min(100, Math.round((dailySends / dailyQuota) * 100));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {/* 1. New Leads Today */}
      <div className="glass-panel rounded-xl p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">New Leads Today</span>
          <div className="rounded-lg bg-indigo-500/10 p-1.5 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{newLeadsCount}</span>
          <span className="text-xs text-indigo-400 font-medium">Ready to review</span>
        </div>
      </div>

      {/* 2. Sent Today */}
      <div className="glass-panel rounded-xl p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Sent Today</span>
          <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
            <Send className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{sentTodayCount}</span>
          <span className="text-xs text-slate-400">emails</span>
        </div>
      </div>

      {/* 3. Total Sent */}
      <div className="glass-panel rounded-xl p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Sent</span>
          <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{totalSentCount}</span>
          <span className="text-xs text-slate-400">dispatches</span>
        </div>
      </div>

      {/* 4. Replies Received */}
      <div className="glass-panel rounded-xl p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Replies Received</span>
          <div className="rounded-lg bg-purple-500/10 p-1.5 text-purple-400">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white">{repliesCount}</span>
          <span className="text-xs text-purple-400 font-medium">Inquiries</span>
        </div>
      </div>

      {/* 5. Daily Send Quota Left */}
      <div className="glass-panel rounded-xl p-4 col-span-2 sm:col-span-1 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Daily Quota Left</span>
          <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-400">
            <Gauge className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-white">{quotaLeft}</span>
            <span className="text-xs text-slate-400">/ {dailyQuota} left</span>
          </div>
          <span className="text-[11px] font-mono text-amber-400/90">{quotaPercent}% used</span>
        </div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              quotaPercent > 80 ? "bg-rose-500" : quotaPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
