"use client";

import { JobLead } from "@/types";
import { Mail, ExternalLink, Send, CheckCircle, Clock, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";

interface LeadCardProps {
  lead: JobLead;
  onSelect: (lead: JobLead) => void;
  onSend: (lead: JobLead) => void;
  isSelected?: boolean;
  onToggleSelect?: (leadId: string) => void;
}

export function LeadCard({ lead, onSelect, onSend, isSelected = false, onToggleSelect }: LeadCardProps) {
  // Score badge color calculation
  const scoreBadgeColor =
    lead.matchScore >= 90
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      : lead.matchScore >= 75
      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
      : "bg-amber-500/10 text-amber-400 border-amber-500/30";

  // Contact status formatting
  const contactBadge = () => {
    switch (lead.contactStatus) {
      case "Email found":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
            <Mail className="h-3 w-3" />
            <span>Email found</span>
          </span>
        );
      case "Email guessed (verify)":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>Email guessed</span>
          </span>
        );
      case "Apply via link only":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700">
            <ExternalLink className="h-3 w-3" />
            <span>Apply via link</span>
          </span>
        );
    }
  };

  const statusBadge = () => {
    switch (lead.status) {
      case "Sent":
        return <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Sent</span>;
      case "Replied":
        return <span className="text-purple-400 font-semibold text-xs flex items-center gap-1">💬 Replied</span>;
      case "Skipped":
        return <span className="text-slate-500 text-xs">Skipped</span>;
      case "Failed":
        return <span className="text-rose-400 text-xs flex items-center gap-1">⚠️ Failed</span>;
      case "New":
      default:
        return <span className="text-indigo-400 font-medium text-xs">New</span>;
    }
  };

  return (
    <div
      onClick={() => onSelect(lead)}
      className={`glass-panel group relative rounded-xl p-4 sm:p-5 transition-all cursor-pointer border ${
        isSelected ? "border-indigo-500/80 bg-indigo-950/20 shadow-md shadow-indigo-500/10" : "hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox and main title */}
        <div className="flex items-start gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect(lead.id);
              }}
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors text-base">
                {lead.title}
              </h3>
              <span className={`rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${scoreBadgeColor}`}>
                {lead.matchScore}% Match
              </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span className="font-medium text-slate-200">{lead.company}</span>
              <span>•</span>
              <span>{lead.country} {lead.city ? `(${lead.city})` : ""}</span>
              <span>•</span>
              <span className="text-slate-500">{lead.source}</span>
            </div>
          </div>
        </div>

        {/* Status / Contact Badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {contactBadge()}
          {statusBadge()}
        </div>
      </div>

      {/* Match Reasons */}
      {lead.matchReasons && lead.matchReasons.length > 0 && (
        <div className="mt-3.5 space-y-1 rounded-lg bg-slate-900/60 p-2.5 text-xs text-slate-300 border border-slate-800/80">
          {lead.matchReasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Card Footer: Quick Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {lead.contactEmail ? (
            <span className="font-mono text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">
              {lead.contactEmail}
            </span>
          ) : (
            <span className="text-slate-500">Apply via direct link</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {lead.status === "New" && lead.contactEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSend(lead);
              }}
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-sm shadow-indigo-600/30"
            >
              <Send className="h-3 w-3" />
              <span>Send</span>
            </button>
          )}

          <div className="flex items-center text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform text-xs">
            <span>Review</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
