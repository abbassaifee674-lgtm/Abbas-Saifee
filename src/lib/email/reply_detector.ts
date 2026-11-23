import { google } from "googleapis";
import { getOAuth2Client } from "./gmail";

export interface ReplyCheckResult {
  replied: boolean;
  replySnippet?: string;
  replyDate?: string;
}

export async function checkForReply(
  threadId: string,
  refreshToken: string,
  abbasEmail: string
): Promise<ReplyCheckResult> {
  try {
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadId,
      format: "metadata",
    });

    const messages = thread.data.messages || [];

    // If there is more than 1 message in the thread
    if (messages.length > 1) {
      // Find messages not sent by Abbas
      for (const msg of messages) {
        const headers = msg.payload?.headers || [];
        const fromHeader = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";

        if (fromHeader && !fromHeader.toLowerCase().includes(abbasEmail.toLowerCase())) {
          return {
            replied: true,
            replySnippet: msg.snippet || "Reply received in thread",
            replyDate: msg.internalDate ? new Date(parseInt(msg.internalDate)).toISOString() : new Date().toISOString(),
          };
        }
      }
    }

    return { replied: false };
  } catch (err) {
    console.warn(`Reply check failed for thread ${threadId}:`, err);
    return { replied: false };
  }
}
