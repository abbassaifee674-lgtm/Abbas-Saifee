"use client";

import { useState, useMemo } from "react";
import { JobLead, LeadStatus } from "@/types";
import { LeadCard } from "./LeadCard";
import {
  Search,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Sparkles,
  SlidersHorizontal,
  Mail,
  ExternalLink,
  Layers
} from "lucide-react";

interface LeadTableProps {
  leads: JobLead[];
  onSelectLead: (lead: JobLead) => void;
  onSendLead: (lead: JobLead) => void;
  onBulkSend: (selectedIds: string[]) => void;
  isEveningMode?: boolean;
}

export function LeadTable({
  leads,
  onSelectLead,
  onSendLead,
  onBulkSend,
  isEveningMode = false,
}: LeadTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"score" | "date">("score");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Derive unique countries and sources from leads
  const countries = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.country))).filter(Boolean);
  }, [leads]);

  const sources = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.source))).filter(Boolean);
  }, [leads]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Evening mode: strictly show leads ready to review (Status === "New")
        if (isEveningMode && lead.status !== "New") {
          return false;
        }

        // Search text
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches =
            lead.title.toLowerCase().includes(q) ||
            lead.company.toLowerCase().includes(q) ||
            lead.country.toLowerCase().includes(q) ||
            lead.matchReasons.some((r) => r.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Country filter
        if (selectedCountry !== "all" && lead.country !== selectedCountry) {
          return false;
        }

        // Status filter
        if (selectedStatus !== "all" && lead.status !== selectedStatus) {
          return false;
        }

        // Source filter
        if (selectedSource !== "all" && lead.source !== selectedSource) {
          return false;
        }

        // Minimum match score
        if (lead.matchScore < minScore) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") {
          return b.matchScore - a.matchScore;
        }
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      });
  }, [leads, isEveningMode, searchQuery, selectedCountry, selectedStatus, selectedSource, minScore, sortBy]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLeads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="glass-panel rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by role, company, country, or skills..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Quick Stats & View Switcher */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="score">Sort by Match Score</option>
              <option value="date">Sort by Posted Date</option>
            </select>

            <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "cards" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  viewMode === "table" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="h-3 w-3" /> Filters:
          </span>

          {/* Country filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status filter */}
          {!isEveningMode && (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Sent">Sent</option>
              <option value="Replied">Replied</option>
              <option value="Skipped">Skipped</option>
              <option value="Failed">Failed</option>
            </select>
          )}

          {/* Source filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="rounded-md border border-slate-800 bg-slate-900/90 px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Min Score filter */}
          <div className="flex items-center gap-1.5 ml-auto text-slate-400 text-xs">
            <span>Min Match:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20 accent-indigo-500"
            />
            <span className="font-mono text-indigo-400 font-semibold">{minScore}%</span>
          </div>
        </div>
      </div>

      {/* Bulk Action Header when items are selected */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-indigo-950/60 border border-indigo-500/40 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <CheckSquare className="h-4 w-4 text-indigo-400" />
            <span>
              <strong>{selectedIds.length}</strong> leads selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Deselect
            </button>
            <button
              onClick={() => onBulkSend(selectedIds)}
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 font-medium text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
            >
              Send Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Leads List / Table */}
      {filteredLeads.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Layers className="mx-auto h-10 w-10 text-slate-500 mb-3" />
          <h3 className="text-base font-semibold text-white">No job leads found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {isEveningMode
              ? "All caught up for today! No pending 'New' leads remain for review."
              : "Try adjusting your filters or click 'Find Jobs Now' to run the hunter engine."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 gap-3">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onSelect={onSelectLead}
              onSend={onSendLead}
              isSelected={selectedIds.includes(lead.id)}
              onToggleSelect={toggleSelectOne}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="glass-panel overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600"
                  />
                </th>
                <th className="p-3">Role & Company</th>
                <th className="p-3">Country</th>
                <th className="p-3">Match</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                >
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(lead.id)}
                      onChange={() => toggleSelectOne(lead.id)}
                      className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-indigo-600"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-white">{lead.title}</div>
                    <div className="text-slate-400 text-[11px]">{lead.company}</div>
                  </td>
                  <td className="p-3">{lead.country}</td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-indigo-400">{lead.matchScore}%</span>
                  </td>
                  <td className="p-3 text-slate-400">{lead.contactStatus}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        lead.status === "Sent"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : lead.status === "Replied"
                          ? "bg-purple-500/10 text-purple-400"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {lead.status === "New" && lead.contactEmail && (
                      <button
                        onClick={() => onSendLead(lead)}
                        className="rounded bg-indigo-600 px-2.5 py-1 font-medium text-white hover:bg-indigo-500 text-[11px]"
                      >
                        Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
