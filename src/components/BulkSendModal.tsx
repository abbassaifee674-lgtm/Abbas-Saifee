"use client";

import { useState, useEffect } from "react";
import { Send, AlertTriangle, CheckCircle2, Clock, X } from "lucide-react";

interface BulkSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeadCount: number;
  onConfirm: () => Promise<void>;
  isProcessing?: boolean;
}

export function BulkSendModal({
  isOpen,
  onClose,
  selectedLeadCount,
  onConfirm,
  isProcessing = false,
}: BulkSendModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Batch Application Dispatch</h3>
              <p className="text-xs text-slate-400">Review before launching automated outreach</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details & Disclaimers */}
        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Leads selected for dispatch:</span>
              <span className="font-bold text-white font-mono text-base">{selectedLeadCount} applications</span>
            </div>
            <div className="mt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Attached CV:</span>
              <span className="font-mono text-slate-300">Abbas_Saifee_Procurement_CV.pdf</span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-3.5 text-xs text-indigo-200">
            <Clock className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Gmail Deliverability Safeguard:</span> A randomized 30 to 90
              second pause is enforced between dispatches. This prevents spam flagging and ensures Abbas's personal
              Gmail inbox maintains high deliverability.
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            type="button"
            className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || selectedLeadCount === 0}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
          >
            <Send className={`h-3.5 w-3.5 ${isProcessing ? "animate-spin" : ""}`} />
            <span>{isProcessing ? "Dispatching in progress..." : `Send All ${selectedLeadCount} Approved`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
