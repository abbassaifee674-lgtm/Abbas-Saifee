"use client";

import { useState } from "react";
import { JobLead } from "@/types";
import {
  X,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Paperclip,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from "lucide-react";

interface LeadDetailDrawerProps {
  lead: JobLead | null;
  onClose: () => void;
  onSend: (lead: JobLead, subject: string, body: string) => Promise<void>;
  onSkip: (leadId: string) => void;
  onRegenerate: (lead: JobLead, instruction?: string) => Promise<void>;
  isSending?: boolean;
  isRegenerating?: boolean;
  attachedCVName?: string;
  hasCompanyEmailedRecently?: boolean;
}

export function LeadDetailDrawer({
  lead,
  onClose,
  onSend,
  onSkip,
  onRegenerate,
  isSending = false,
  isRegenerating = false,
  attachedCVName = "Abbas_Saifee_Procurement_CV.pdf",
  hasCompanyEmailedRecently = false,
}: LeadDetailDrawerProps) {
  if (!lead) return null;

  const [subject, setSubject] = useState(lead.emailSubject);
  const [body, setBody] = useState(lead.emailBody);
  const [customPrompt, setCustomPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [showRegenerateInput, setShowRegenerateInput] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLinkOnly = lead.contactStatus === "Apply via link only" || !lead.contactEmail;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-400 font-mono">
                  {lead.matchScore}% Match
                </span>
                <span className="text-xs text-slate-400">{lead.country}</span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-white leading-tight">{lead.title}</h2>
              <p className="text-xs text-slate-300 font-medium">{lead.company}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Warnings */}
            {hasCompanyEmailedRecently && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Recent Outreach Notice:</span> You have emailed an application to{" "}
                  <strong>{lead.company}</strong> within the last 30 days. Proceed only if this is a distinct team or role.
                </div>
              </div>
            )}

            {lead.status === "Failed" && lead.error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-semibold">Previous dispatch failed:</span> {lead.error}
                </div>
              </div>
            )}

            {/* Match Analysis Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                Match Evaluation
              </h3>

              <div className="space-y-1.5 text-xs">
                {lead.matchReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{reason}</span>
                  </div>
                ))}

                {lead.missingSkills && lead.missingSkills.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start gap-2 text-amber-400/90 text-xs">
                    <span className="font-bold shrink-0">!</span>
                    <span>Missing skills to be aware of: {lead.missingSkills.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Contact Information */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Recipient Contact:</span>
                <span className="font-semibold text-white">{lead.contactStatus}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-300 font-medium">{lead.contactEmail || "None available"}</span>
                <a
                  href={lead.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline text-xs"
                >
                  <span>Open Job Listing</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Email Draft Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  Tailored Outreach Draft
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRegenerateInput(!showRegenerateInput)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Regenerate with instruction</span>
                </button>
              </div>

              {showRegenerateInput && (
                <div className="flex gap-2 rounded-lg bg-slate-800/80 p-2 border border-slate-700">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. 'Make it more concise' or 'Emphasize SAP MM'"
                    className="flex-1 bg-transparent px-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={async () => {
                      await onRegenerate(lead, customPrompt);
                      setShowRegenerateInput(false);
                    }}
                    disabled={isRegenerating}
                    className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isRegenerating ? "Rewriting..." : "Apply"}
                  </button>
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Body Textarea */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Body (120 - 180 words)</label>
                <textarea
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs leading-relaxed text-slate-200 focus:border-indigo-500 focus:outline-none font-sans"
                />
              </div>

              {/* Attachment Pill */}
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-400">
                <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                <span>Attachment:</span>
                <span className="font-mono text-slate-200 font-medium">{attachedCVName}</span>
                <span className="text-emerald-400 text-[10px] ml-auto">Verified ATS PDF</span>
              </div>
            </div>

            {/* Job Description Full Collapsible */}
            <details className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <summary className="text-xs font-semibold text-slate-300 cursor-pointer select-none">
                View Full Original Job Description
              </summary>
              <div className="mt-3 text-xs leading-relaxed text-slate-400 whitespace-pre-wrap max-h-60 overflow-y-auto">
                {lead.description}
              </div>
            </details>
          </div>

          {/* Drawer Actions Footer */}
          <div className="border-t border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between gap-3">
            <button
              onClick={() => onSkip(lead.id)}
              type="button"
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Skip Lead
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy Text"}</span>
              </button>

              {isLinkOnly ? (
                <a
                  href={lead.applyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Application Page</span>
                </a>
              ) : (
                <button
                  onClick={() => onSend(lead, subject, body)}
                  disabled={isSending || lead.status === "Sent"}
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/30"
                >
                  <Send className={`h-3.5 w-3.5 ${isSending ? "animate-spin" : ""}`} />
                  <span>
                    {isSending
                      ? "Dispatching..."
                      : lead.status === "Sent"
                      ? "Already Sent"
                      : "Send Application Now"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
