import { NextRequest, NextResponse } from "next/server";
import { getGmailAuthUrl } from "@/lib/email/gmail";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";

export async function GET(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const authUrl = getGmailAuthUrl();
    return NextResponse.json({ url: authUrl });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate Gmail OAuth URL. Check GMAIL_CLIENT_ID configuration." },
      { status: 500 }
    );
  }
}
