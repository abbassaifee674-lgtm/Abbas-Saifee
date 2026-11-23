import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { isDemoModeActive } from "@/lib/env";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  // Seed/reset is only allowed in DEMO_MODE
  if (!isDemoModeActive()) {
    return NextResponse.json(
      { error: "Seed data is not available in production mode. Set DEMO_MODE=true to enable demo data." },
      { status: 403 }
    );
  }

  memoryStore.resetSeedData();
  return NextResponse.json({
    success: true,
    message: "Seed demo leads and profile reset successfully",
    leads: memoryStore.getLeads(),
  });
}
