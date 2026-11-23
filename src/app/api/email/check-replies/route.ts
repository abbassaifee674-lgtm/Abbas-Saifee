import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { checkForReply } from "@/lib/email/reply_detector";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { getGmailRefreshToken } from "@/lib/firebase/server_store";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const leads = memoryStore.getLeads();
    const sentLeads = leads.filter((l) => l.status === "Sent" && l.gmailMessageId);

    const refreshToken = await getGmailRefreshToken();
    const repliesFound = [];

    if (refreshToken) {
      for (const lead of sentLeads) {
        if (!lead.gmailMessageId) continue;
        const res = await checkForReply(lead.gmailMessageId, refreshToken, ALLOWED_EMAIL);
        if (res.replied) {
          lead.status = "Replied";
          lead.updatedAt = new Date().toISOString();
          memoryStore.saveLead(lead);
          repliesFound.push({ id: lead.id, company: lead.company });
        }
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: sentLeads.length,
      repliesFoundCount: repliesFound.length,
      repliesFound,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
