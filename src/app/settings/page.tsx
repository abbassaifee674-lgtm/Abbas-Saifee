"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { UserProfile, UserSettings } from "@/types";
import { ALLOWED_EMAIL, INITIAL_COUNTRIES, INITIAL_JOB_TITLES } from "@/lib/constants/defaults";
import {
  Save,
  Upload,
  FileText,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  X,
  Sliders,
  Sparkles
} from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch("/api/cv/profile", { headers: { "x-demo-user": "abbas" } }),
          fetch("/api/settings", { headers: { "x-demo-user": "abbas" } }),
        ]);

        if (pRes.ok) {
          const pData = await pRes.json();
          setProfile(pData.profile);
        }
        if (sRes.ok) {
          const sData = await sRes.json();
          setSettings(sData.settings);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings || !profile) return;
    setIsSaving(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-demo-user": "abbas" },
          body: JSON.stringify(settings),
        }),
        fetch("/api/cv/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-demo-user": "abbas" },
          body: JSON.stringify(profile),
        }),
      ]);

      if (sRes.ok && pRes.ok) {
        showToast("Settings and profile successfully saved!", "success");
      } else {
        throw new Error("Failed to save changes");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Only PDF files are supported for CV upload.", "error");
      return;
    }

    const fileSizeKB = Math.round(file.size / 1024);
    if (file.size > 700 * 1024) {
      showToast(
        `PDF is ${fileSizeKB} KB. For best performance on Firestore free tier, please compress your PDF under 700 KB. Uploading with multi-document chunking fallback...`,
        "info"
      );
    } else {
      showToast("Uploading CV and extracting structured profile via Gemini AI...", "success");
    }

    setIsUploadingCV(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/cv/upload", {
        method: "POST",
        headers: { "x-demo-user": "abbas" },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        showToast(`CV "${data.fileName}" parsed and profile updated!`, "success");
      } else {
        throw new Error(data.error || "CV upload failed");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsUploadingCV(false);
    }
  };

  const toggleCountry = (country: string) => {
    if (!settings) return;
    const exists = settings.targetCountries.includes(country);
    setSettings({
      ...settings,
      targetCountries: exists
        ? settings.targetCountries.filter((c) => c !== country)
        : [...settings.targetCountries, country],
    });
  };

  const addSkill = () => {
    if (!newSkill.trim() || !profile) return;
    setProfile({
      ...profile,
      skills: [...profile.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    if (!profile) return;
    setProfile({
      ...profile,
      skills: profile.skills.filter((_, i) => i !== index),
    });
  };

  if (!profile || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading settings...
      </div>
    );
  }

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

      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-8 w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">User Settings & Profile</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure search parameters, daily email limits, outreach tone, and CV parsing for Abbas Saifee.
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>

        {/* 1. Gmail API Connection Status */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-500/10 p-2.5 text-red-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Gmail API Integration (OAuth2)</h2>
                <p className="text-xs text-slate-400">
                  Sends applications directly from Abbas's genuine Gmail address (
                  <span className="font-mono text-slate-200">{ALLOWED_EMAIL}</span>) and saves to Sent folder.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              Authorized Test User
            </span>
          </div>

          <div className="rounded-xl bg-slate-950/60 p-4 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-slate-300 font-medium">OAuth2 Sender Status:</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                Refresh token encrypted server-side with AES-256-GCM.
              </div>
            </div>
            <a
              href="/api/auth/gmail"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-xs"
            >
              <span>Connect / Re-authenticate Gmail</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* 2. Target Countries & Job Titles */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            Job Hunting Target Criteria
          </h2>

          {/* Countries */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Target Countries (Active for Automatic Job Finding)
            </label>
            <div className="flex flex-wrap gap-2">
              {INITIAL_COUNTRIES.map((country) => {
                const isSelected = settings.targetCountries.includes(country);
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleCountry(country)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30"
                        : "bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {country}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Titles */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Target Job Titles / Keywords</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.targetJobTitles.map((title, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-200 border border-slate-700"
                >
                  <span>{title}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        targetJobTitles: settings.targetJobTitles.filter((_, i) => i !== idx),
                      });
                    }}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Add title (e.g., Strategic Sourcing Lead)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (newTitle.trim()) {
                    setSettings({
                      ...settings,
                      targetJobTitles: [...settings.targetJobTitles, newTitle.trim()],
                    });
                    setNewTitle("");
                  }
                }}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                Add Title
              </button>
            </div>
          </div>

          {/* Sliders: Min Match Score & Max Emails Per Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Minimum Match Score Threshold</span>
                <span className="font-mono text-indigo-400 font-bold">{settings.minMatchScore}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={settings.minMatchScore}
                onChange={(e) => setSettings({ ...settings, minMatchScore: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Leads below this score will not be saved.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                <span>Max Outreach Emails Per Day</span>
                <span className="font-mono text-amber-400 font-bold">
                  {settings.maxEmailsPerDay} / day (Hard Cap 40)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={settings.maxEmailsPerDay}
                onChange={(e) => setSettings({ ...settings, maxEmailsPerDay: Math.min(40, Number(e.target.value)) })}
                className="w-full accent-amber-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Protects Abbas's Gmail domain reputation.</p>
            </div>
          </div>
        </div>

        {/* 3. Outreach Tone & Signature */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Email Tone & Signature</h2>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="tone"
                checked={settings.emailTone === "formal"}
                onChange={() => setSettings({ ...settings, emailTone: "formal" })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Formal & Direct (Recommended for corporate & aerospace roles)</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="tone"
                checked={settings.emailTone === "friendly"}
                onChange={() => setSettings({ ...settings, emailTone: "friendly" })}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Friendly & Approachable</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Signature</label>
            <textarea
              rows={5}
              value={settings.emailSignature}
              onChange={(e) => setSettings({ ...settings, emailSignature: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs font-mono text-slate-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 4. CV Upload & Parsed Profile */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                Curriculum Vitae (PDF) & AI Structured Profile
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current attached file: <span className="font-mono text-indigo-300">{profile.cvFileName}</span>
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Stored in Cloud Firestore (Free Spark Plan • Max recommended: 700 KB)
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all border border-slate-700">
              <Upload className="h-4 w-4 text-indigo-400" />
              <span>{isUploadingCV ? "Parsing & Storing..." : "Upload New CV (PDF)"}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCVUpload}
                disabled={isUploadingCV}
                className="hidden"
              />
            </label>
          </div>

          {/* Editable Skills */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Verified Core Skills</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {profile.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 px-2.5 py-1 text-xs text-indigo-200"
                >
                  <span>{skill}</span>
                  <button type="button" onClick={() => removeSkill(idx)} className="text-indigo-400 hover:text-white">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill (e.g. Contract Negotiation)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addSkill}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Experience Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Executive Summary</label>
            <textarea
              rows={3}
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
