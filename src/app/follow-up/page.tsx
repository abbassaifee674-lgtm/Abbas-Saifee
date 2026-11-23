"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { JobLead } from "@/types";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import {
  Clock,
  Send,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MailQuestion
} from "lucide-react";

export default function FollowUpPage() {
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [isCheckingReplies, setIsCheckingReplies] = useState(false);
  const [isSendingId, setIsSendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/jobs/leads", { headers: { "x-demo-user": "abbas" } });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // Filter leads sent 7 or more days ago with status "Sent" (no reply received yet)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const followUpLeads = leads.filter((lead) => {
    if (lead.status !== "Sent" || !lead.sentAt) return false;
    return new Date(lead.sentAt) <= sevenDaysAgo;
  });

  const handleSendFollowUp = async (lead: JobLead) => {
    setIsSendingId(lead.id);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-user": "abbas" },
        body: JSON.stringify({
          leadId: lead.id,
          subject: lead.followUpSubject || `Following up: ${lead.emailSubject}`,
          body: lead.followUpBody || `Hi ${lead.company} Team,\n\nFollowing up on my previous note regarding the ${lead.title} opportunity. Please let me know if you need any additional information from my side.\n\nBest regards,\nAbbas Saifee`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Follow-up dispatched to ${lead.company}!`, "success");
        await loadLeads();
      } else {
        throw new Error(data.error || "Failed to dispatch follow-up");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSendingId(null);
    }
  };

  const handleCheckReplies = async () => {
    setIsCheckingReplies(true);
    showToast("Inspecting Gmail inbox threads for employer replies...", "info");
    try {
      const res = await fetch("/api/email/check-replies", {
        method: "POST",
        headers: { "x-demo-user": "abbas" },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Reply check completed. Found ${data.repliesFoundCount} new replies.`, "success");
        await loadLeads();
      } else {
        throw new Error(data.error || "Reply check failed");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsCheckingReplies(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar allowedEmail={ALLOWED_EMAIL} />

      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-2xl ${
            toast.type === "error"
              ? "bg-rose-950 border border-rose-800 text-rose-200"
              : "bg-emerald-950 border border-emerald-800 text-emerald-200"
          }`}
        >
          {toast.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-8 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Follow-up Reminders (7+ Days)</h1>
            <p className="text-xs text-slate-400 mt-1">
              Applications sent at least 7 days ago with no reply received. Dispatches only on your manual click.
            </p>
          </div>
          <button
            onClick={handleCheckReplies}
            disabled={isCheckingReplies}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-400 ${isCheckingReplies ? "animate-spin" : ""}`} />
            <span>{isCheckingReplies ? "Checking Gmail Threads..." : "Check Replies Now"}</span>
          </button>
        </div>

        {followUpLeads.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <MailQuestion className="mx-auto h-12 w-12 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-white">No pending follow-ups</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              All applications sent over 7 days ago have either received a reply or are marked appropriately. Great job!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {followUpLeads.map((lead) => {
              const daysAgo = Math.floor(
                (Date.now() - new Date(lead.sentAt!).getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={lead.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
                          {daysAgo} days since outreach
                        </span>
                        <span className="text-xs text-slate-400">{lead.country}</span>
                      </div>
                      <h2 className="mt-1 text-base font-bold text-white">{lead.title}</h2>
                      <p className="text-xs text-slate-300 font-medium">{lead.company}</p>
                    </div>

                    <button
                      onClick={() => handleSendFollowUp(lead)}
                      disabled={isSendingId === lead.id}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30 shrink-0"
                    >
                      <Send className={`h-3.5 w-3.5 ${isSendingId === lead.id ? "animate-spin" : ""}`} />
                      <span>{isSendingId === lead.id ? "Sending..." : "Send Follow-up Note"}</span>
                    </button>
                  </div>

                  {/* AI Follow-up Draft Snippet */}
                  <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800 text-xs space-y-2">
                    <div className="font-semibold text-slate-300">
                      Subject: {lead.followUpSubject || `Following up: ${lead.emailSubject}`}
                    </div>
                    <div className="text-slate-400 whitespace-pre-wrap leading-relaxed font-sans">
                      {lead.followUpBody ||
                        `Hi ${lead.company} Hiring Team,\n\nI wanted to briefly follow up on my application submitted for the ${lead.title} position. I remain very enthusiastic about bringing my 6+ years of procurement background to your team.`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
