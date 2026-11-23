import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  memoryStore.resetSeedData();
  return NextResponse.json({
    success: true,
    message: "Seed demo leads and profile reset successfully",
    leads: memoryStore.getLeads(),
  });
}
