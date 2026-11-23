import { NextRequest, NextResponse } from "next/server";
import { JobHunterEngine } from "@/lib/jobs/engine";
import { memoryStore } from "@/lib/firebase/mock_store";

export const maxDuration = 60; // Allow 60 seconds on Vercel Pro/Hobby

export async function GET(req: NextRequest) {
  // Verify Vercel Cron Secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const profile = memoryStore.getProfile();
    const settings = memoryStore.getSettings();
    const existingLeads = memoryStore.getLeads();

    const engine = new JobHunterEngine();
    const { newLeads, log } = await engine.run(profile, settings, existingLeads, "cron");

    memoryStore.saveLeads(newLeads);
    memoryStore.addLog(log);
    memoryStore.updateSettings({ lastFindJobsRun: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      newLeadsFound: newLeads.length,
      log,
    });
  } catch (err: any) {
    console.error("Cron find-jobs error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
