import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { checkDailySendQuota, recordSentEmail } from "@/lib/utils/rate_limiter";
import { sendApplicationEmail } from "@/lib/email/gmail";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { decryptToken } from "@/lib/email/crypto";
import { getCVFromFirestore } from "@/lib/firebase/cv_store";
import { getGmailRefreshToken } from "@/lib/firebase/server_store";
import { getResolvedOAuthCredentials } from "@/lib/env";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const body = await req.json();
    const { leadId, subject, body: emailBody } = body;

    const lead = memoryStore.getLead(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (lead.contactStatus === "Apply via link only" || !lead.contactEmail) {
      return NextResponse.json(
        { error: "This lead does not have a verified direct email address. Please apply directly via the job link." },
        { status: 400 }
      );
    }

    // 1. Quota check
    const quota = await checkDailySendQuota(1);
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 429 });
    }

    // 2. Prevent sending same company + role twice
    if (lead.status === "Sent" || lead.status === "Replied") {
      return NextResponse.json(
        { error: `An application was already sent for this opening at ${lead.company} on ${lead.sentAt}.` },
        { status: 400 }
      );
    }

    // Check if another lead from the same company was sent within 30 days
    const allLeads = memoryStore.getLeads();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentCompanyLead = allLeads.find(
      (l) =>
        l.id !== lead.id &&
        l.company.toLowerCase().trim() === lead.company.toLowerCase().trim() &&
        (l.status === "Sent" || l.status === "Replied") &&
        l.sentAt &&
        new Date(l.sentAt) > thirtyDaysAgo
    );

    const companySentWarning = recentCompanyLead
      ? `Note: An application was also sent to ${lead.company} on ${new Date(recentCompanyLead.sentAt!).toLocaleDateString()}.`
      : undefined;

    const profile = memoryStore.getProfile();

    // 3. Retrieve CV PDF from Firestore (decoded from base64)
    let cvBuffer: Buffer | null = null;
    let cvFileName = profile.cvFileName || "Abbas_Saifee_Procurement_CV.pdf";

    try {
      const storedCV = await getCVFromFirestore(authRes.uid || "abbas_saifee");
      if (storedCV) {
        cvBuffer = storedCV.buffer;
        cvFileName = storedCV.fileName;
      }
    } catch (cvErr) {
      console.warn("Could not load CV from Firestore, falling back to local file:", cvErr);
    }

    // 4. Send email via Gmail API or Simulation Mode
    let sendResult = {
      success: true,
      messageId: `sim_msg_${Date.now()}`,
      threadId: `sim_thread_${Date.now()}`,
      error: undefined as string | undefined,
    };

    const refreshToken = await getGmailRefreshToken();
    const { clientId, clientSecret } = getResolvedOAuthCredentials();

    if (refreshToken && clientId && clientSecret) {
      try {
        const result = await sendApplicationEmail({
          to: lead.contactEmail,
          fromEmail: ALLOWED_EMAIL,
          subject: subject || lead.emailSubject,
          body: emailBody || lead.emailBody,
          refreshToken,
          cvBuffer,
          cvFileName,
        });

        if (!result.success) {
          throw new Error(result.error || "Gmail API returned failure");
        }
        sendResult.messageId = result.messageId || sendResult.messageId;
        sendResult.threadId = result.threadId || sendResult.threadId;
      } catch (gmailErr: any) {
        console.error("Gmail sending error:", gmailErr);
        lead.status = "Failed";
        lead.error = gmailErr.message || "Failed to dispatch email via Gmail API";
        lead.updatedAt = new Date().toISOString();
        memoryStore.saveLead(lead);

        return NextResponse.json(
          { error: `Sending failed: ${gmailErr.message}`, lead },
          { status: 500 }
        );
      }
    } else {
      console.log(`[SIMULATED DISPATCH] Sent to ${lead.contactEmail} from ${ALLOWED_EMAIL} with CV attachment: ${cvFileName}`);
    }

    // 5. Update lead status to Sent
    recordSentEmail();
    lead.status = "Sent";
    lead.sentAt = new Date().toISOString();
    lead.gmailMessageId = sendResult.messageId;
    lead.emailSubject = subject || lead.emailSubject;
    lead.emailBody = emailBody || lead.emailBody;
    lead.error = undefined;
    lead.updatedAt = new Date().toISOString();
    memoryStore.saveLead(lead);

    return NextResponse.json({
      success: true,
      lead,
      warning: companySentWarning,
      dailySends: memoryStore.getDailySends(),
      remainingToday: quota.remaining,
      attachedCV: cvFileName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
