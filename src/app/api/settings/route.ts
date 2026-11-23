import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { HARD_CAP_DAILY_EMAILS } from "@/lib/utils/rate_limiter";

export async function GET(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  const settings = memoryStore.getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    
    // Ensure hard cap of 40 emails per day is respected
    if (body.maxEmailsPerDay && body.maxEmailsPerDay > HARD_CAP_DAILY_EMAILS) {
      body.maxEmailsPerDay = HARD_CAP_DAILY_EMAILS;
    }

    const updated = memoryStore.updateSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
