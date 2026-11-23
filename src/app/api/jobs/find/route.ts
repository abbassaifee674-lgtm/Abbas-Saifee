import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { JobHunterEngine } from "@/lib/jobs/engine";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const profile = memoryStore.getProfile();
    const settings = memoryStore.getSettings();
    const existingLeads = memoryStore.getLeads();

    const engine = new JobHunterEngine();
    const { newLeads, log } = await engine.run(profile, settings, existingLeads, "manual");

    memoryStore.saveLeads(newLeads);
    memoryStore.addLog(log);
    memoryStore.updateSettings({ lastFindJobsRun: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      newLeadsCount: newLeads.length,
      log,
      newLeads,
    });
  } catch (err: any) {
    console.error("Job hunting run failed:", err);
    return NextResponse.json({ error: err.message || "Failed to find jobs" }, { status: 500 });
  }
}
