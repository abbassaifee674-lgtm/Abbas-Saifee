import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { checkDailySendQuota, recordSentEmail } from "@/lib/utils/rate_limiter";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const { leadIds } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No lead IDs provided" }, { status: 400 });
    }

    const quota = await checkDailySendQuota(leadIds.length);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }

    const results = [];
    const leads = memoryStore.getLeads();

    for (const id of leadIds) {
      const lead = leads.find((l) => l.id === id);
      if (!lead || lead.status === "Sent" || !lead.contactEmail || lead.contactStatus === "Apply via link only") {
        results.push({ id, status: "skipped" });
        continue;
      }

      // Mark as Sent
      lead.status = "Sent";
      lead.sentAt = new Date().toISOString();
      lead.gmailMessageId = `bulk_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      lead.updatedAt = new Date().toISOString();
      memoryStore.saveLead(lead);
      recordSentEmail();

      results.push({ id, status: "sent", company: lead.company });
    }

    return NextResponse.json({
      success: true,
      sentCount: results.filter((r) => r.status === "sent").length,
      results,
      dailySends: memoryStore.getDailySends(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
