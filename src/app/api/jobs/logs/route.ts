import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { getFirestoreRunLogs } from "@/lib/firebase/server_store";
import { memoryStore } from "@/lib/firebase/mock_store";

export async function GET(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    // Try Firestore first; fall back to in-memory logs
    const firestoreLogs = await getFirestoreRunLogs();
    if (firestoreLogs.length > 0) {
      return NextResponse.json({ logs: firestoreLogs });
    }

    // Fallback: in-memory logs (populated during this server session)
    const memLogs = memoryStore.getLogs ? memoryStore.getLogs() : [];
    return NextResponse.json({ logs: memLogs });
  } catch (err: any) {
    console.error("Failed to fetch run logs:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch logs" }, { status: 500 });
  }
}
