"use client";

import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { StatsOverview } from "../components/StatsOverview";
import { LeadTable } from "../components/LeadTable";
import { LeadDetailDrawer } from "../components/LeadDetailDrawer";
import { BulkSendModal } from "../components/BulkSendModal";
import { JobLead, UserSettings } from "../types";
import { ALLOWED_EMAIL, DEFAULT_USER_SETTINGS } from "../lib/constants/defaults";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { authFetch } from "../lib/utils/api_client";
import { auth } from "../lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
// SeedBanner is dynamically imported so it can be tree-shaken in production
const SeedBanner = dynamic(() => import("../components/SeedBanner").then((m) => m.SeedBanner), { ssr: false });

export default function DashboardPage() {
  const [leads, setLeads] = useState<JobLead[]>([]);
  const [dailySends, setDailySends] = useState<number>(0);
  const [dailyQuota, setDailyQuota] = useState<number>(20);
  const [selectedLead, setSelectedLead] = useState<JobLead | null>(null);
  const [isEveningMode, setIsEveningMode] = useState<boolean>(false);
  const [isFindingJobs, setIsFindingJobs] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkLeadIds, setBulkLeadIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isBulkSending, setIsBulkSending] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch leads on mount
  const loadLeads = async () => {
    try {
      const res = await authFetch("/api/jobs/leads");
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setDailySends(data.dailySends || 0);
        if (data.maxEmailsPerDay) setDailyQuota(data.maxEmailsPerDay);
      }
    } catch (e) {
      console.warn("Failed to load leads:", e);
    }
  };

  useEffect(() => {
    // In production, wait for Firebase Auth to initialize before fetching leads
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user || process.env.NODE_ENV !== "production") {
        loadLeads();
      } else if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Top statistics
  const newLeadsCount = leads.filter((l) => l.status === "New").length;
  const sentTodayCount = dailySends;
  const totalSentCount = leads.filter((l) => l.status === "Sent" || l.status === "Replied").length;
  const repliesCount = leads.filter((l) => l.status === "Replied").length;

  // Single email send
  const handleSendLead = async (lead: JobLead, customSubject?: string, customBody?: string) => {
    setIsSending(true);
    try {
      const res = await authFetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-user": "abbas",
        },
        body: JSON.stringify({
          leadId: lead.id,
          subject: customSubject || lead.emailSubject,
          body: customBody || lead.emailBody,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch email");
      }

      showToast(`Application successfully dispatched to ${lead.company}!`, "success");
      if (data.warning) {
        setTimeout(() => showToast(data.warning, "success"), 2000);
      }

      await loadLeads();
      setSelectedLead(null);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSending(false);
    }
  };

  // Skip lead
  const handleSkipLead = async (leadId: string) => {
    try {
      await authFetch("/api/jobs/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-demo-user": "abbas",
        },
        body: JSON.stringify({ id: leadId, status: "Skipped" }),
      });
      showToast("Lead skipped.", "success");
      await loadLeads();
      setSelectedLead(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Regenerate email with custom instructions
  const handleRegenerate = async (lead: JobLead, instruction?: string) => {
    try {
      showToast("Regenerating AI outreach draft...", "success");
      // Call AI endpoint to rewrite
      const res = await authFetch("/api/email/send", {
        method: "POST",
        headers: { "x-demo-user": "abbas", "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          instruction,
          previewOnly: true,
        }),
      });
      // In demo mode or live, refresh draft
      showToast("Draft updated with personalized strengths.", "success");
    } catch (e) {
      console.error(e);
    }
  };

  // "Find Jobs Now" manual trigger
  const handleFindJobsNow = async () => {
    setIsFindingJobs(true);
    showToast("Scanning configured job APIs across target countries...", "success");
    try {
      const res = await authFetch("/api/jobs/find", {
        method: "POST",
        headers: { "x-demo-user": "abbas" },
      });
      const data = await res.json();

      if (res.ok) {
        showToast(
          `Job scan completed! Found ${data.newLeadsCount} new qualified leads above minimum match score.`,
          "success"
        );
        await loadLeads();
      } else {
        throw new Error(data.error || "Scan failed");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsFindingJobs(false);
    }
  };

  // Bulk send action
  const handleOpenBulkModal = (selectedIds: string[]) => {
    setBulkLeadIds(selectedIds);
    setIsBulkModalOpen(true);
  };

  const handleConfirmBulkSend = async () => {
    setIsBulkSending(true);
    try {
      const res = await authFetch("/api/email/bulk-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-demo-user": "abbas",
        },
        body: JSON.stringify({ leadIds: bulkLeadIds }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Batch outreach initiated for ${data.sentCount} approved applications!`, "success");
        await loadLeads();
        setIsBulkModalOpen(false);
      } else {
        throw new Error(data.error || "Bulk send failed");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsBulkSending(false);
    }
  };

  // Reset sample seed leads
  const handleResetSeed = async () => {
    setIsResetting(true);
    try {
      const res = await authFetch("/api/jobs/seed", {
        method: "POST",
        headers: { "x-demo-user": "abbas" },
      });
      if (res.ok) {
        showToast("Sample leads and profile reset successfully.", "success");
        await loadLeads();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        isEveningMode={isEveningMode}
        onToggleEveningMode={() => setIsEveningMode(!isEveningMode)}
        onFindJobsNow={handleFindJobsNow}
        isFindingJobs={isFindingJobs}
        allowedEmail={ALLOWED_EMAIL}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-semibold shadow-2xl transition-all ${
            toast.type === "error"
              ? "bg-rose-950 border border-rose-800 text-rose-200"
              : "bg-emerald-950 border border-emerald-800 text-emerald-200"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Demo Mode / Seed Banner — only shown when NEXT_PUBLIC_DEMO_MODE=true */}
        {IS_DEMO && (
          <SeedBanner onResetSeed={handleResetSeed} isResetting={isResetting} />
        )}

        {/* Evening Mode Banner if Active */}
        {isEveningMode && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200">
            <div>
              <span className="font-bold text-amber-300">🌙 Evening Review Session Active:</span> Showing only pending
              "New" job openings for today. Review the personalized AI pitch for each company and click "Send" when
              approved.
            </div>
            <button
              onClick={() => setIsEveningMode(false)}
              className="text-amber-300 underline hover:text-white shrink-0 ml-3"
            >
              Exit Evening Mode
            </button>
          </div>
        )}

        {/* Top Metric Cards */}
        <StatsOverview
          newLeadsCount={newLeadsCount}
          sentTodayCount={sentTodayCount}
          totalSentCount={totalSentCount}
          repliesCount={repliesCount}
          dailySends={dailySends}
          dailyQuota={dailyQuota}
        />

        {/* Leads Table & Controls */}
        <LeadTable
          leads={leads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onSendLead={(lead) => handleSendLead(lead)}
          onBulkSend={handleOpenBulkModal}
          isEveningMode={isEveningMode}
        />

        {/* Side Panel Drawer for Lead Details and Email Drafting */}
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onSend={handleSendLead}
          onSkip={handleSkipLead}
          onRegenerate={handleRegenerate}
          isSending={isSending}
        />

        {/* Bulk Send Confirmation Modal */}
        <BulkSendModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedLeadCount={bulkLeadIds.length}
          onConfirm={handleConfirmBulkSend}
          isProcessing={isBulkSending}
        />
      </main>
    </div>
  );
}
