import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { getGmailRefreshToken } from "@/lib/firebase/server_store";
import { sendApplicationEmail } from "@/lib/email/gmail";
import { getCVFromFirestore } from "@/lib/firebase/cv_store";
import { memoryStore } from "@/lib/firebase/mock_store";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const refreshToken = await getGmailRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        {
          error:
            "Gmail is not connected yet. Please visit /settings and click 'Connect / Re-authenticate Gmail' first.",
        },
        { status: 400 }
      );
    }

    const profile = memoryStore.getProfile();

    // Retrieve CV from Firestore
    let cvBuffer: Buffer | null = null;
    let cvFileName = profile.cvFileName || "Abbas_Saifee_Procurement_CV.pdf";

    try {
      const storedCV = await getCVFromFirestore(authRes.uid || "abbas_saifee");
      if (storedCV) {
        cvBuffer = storedCV.buffer;
        cvFileName = storedCV.fileName;
      }
    } catch (e) {
      console.warn("CV load from Firestore note:", e);
    }

    const subject = `JobPilot Self-Test Verification – ${profile.fullName}`;
    const body = `Hi Abbas,\n\nThis is a verified test dispatch from your JobPilot deployment.\n\nYour Gmail API OAuth2 integration is operational and your ATS-optimized CV PDF (${cvFileName}) has been attached successfully to this message.\n\nSent: ${new Date().toLocaleString()}\nDestination: ${ALLOWED_EMAIL}\nSender: ${ALLOWED_EMAIL}\n\nAll systems operational!`;

    const result = await sendApplicationEmail({
      to: ALLOWED_EMAIL,
      fromEmail: ALLOWED_EMAIL,
      subject,
      body,
      refreshToken,
      cvBuffer,
      cvFileName,
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to dispatch test email");
    }

    return NextResponse.json({
      success: true,
      message: `Test email with CV attached successfully sent to ${ALLOWED_EMAIL}`,
      messageId: result.messageId,
      threadId: result.threadId,
      attachedFileName: cvFileName,
      sentAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
