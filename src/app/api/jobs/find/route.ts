import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { JobHunterEngine } from "@/lib/jobs/engine";
import { getFirestoreLeads, saveFirestoreLeads, saveFirestoreRunLog } from "@/lib/firebase/server_store";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const profile = memoryStore.getProfile();
    const settings = memoryStore.getSettings();

    // Load existing leads from Firestore (source of truth) for deduplication
    let existingLeads = memoryStore.getLeads();
    if (existingLeads.length === 0) {
      const firestoreLeads = await getFirestoreLeads();
      if (firestoreLeads.length > 0) {
        existingLeads = firestoreLeads;
        memoryStore.saveLeads(existingLeads);
      }
    }

    const engine = new JobHunterEngine();
    const { newLeads, log } = await engine.run(profile, settings, existingLeads, "manual");

    // Persist to Firestore (source of truth) + in-memory cache
    if (newLeads.length > 0) {
      await saveFirestoreLeads(newLeads);
      memoryStore.saveLeads([...existingLeads, ...newLeads]);
    }

    // Persist the run log to Firestore
    await saveFirestoreRunLog(log);
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
