import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { getResolvedOAuthCredentials } from "../env";

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  refreshToken: string;
  cvBuffer?: Buffer | null;
  cvFilePath?: string;
  cvFileName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

export function getOAuth2Client(customRedirectUri?: string) {
  const { clientId, clientSecret, redirectUri } = getResolvedOAuthCredentials();
  return new google.auth.OAuth2(clientId, clientSecret, customRedirectUri || redirectUri);
}

export function getGmailAuthUrl(customRedirectUri?: string): string {
  const oauth2Client = getOAuth2Client(customRedirectUri);
  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function sendApplicationEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: params.refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // 1. Resolve CV attachment buffer (prefer buffer from Firestore)
  let cvAttachmentBuffer: Buffer | null = params.cvBuffer || null;
  const fileName = params.cvFileName || "Abbas_Saifee_Procurement_CV.pdf";

  // Fallback to local filesystem assets if no buffer provided directly
  if (!cvAttachmentBuffer) {
    const potentialPaths = [
      params.cvFilePath,
      path.join(process.cwd(), "assets", fileName),
      path.join(process.cwd(), "assets", "Abbas_Saifee_Procurement_CV.pdf"),
    ].filter(Boolean) as string[];

    for (const p of potentialPaths) {
      if (fs.existsSync(p)) {
        cvAttachmentBuffer = fs.readFileSync(p);
        break;
      }
    }
  }

  try {
    const rawMessage = buildMimeMessage({
      to: params.to,
      from: params.fromEmail,
      subject: params.subject,
      body: params.body,
      attachmentBuffer: cvAttachmentBuffer,
      attachmentFileName: fileName,
    });

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    return {
      success: true,
      messageId: res.data.id || undefined,
      threadId: res.data.threadId || undefined,
    };
  } catch (err: any) {
    console.error("Gmail API sending failed:", err);
    return {
      success: false,
      error: err.message || "Failed to send email via Gmail API.",
    };
  }
}

function buildMimeMessage(options: {
  to: string;
  from: string;
  subject: string;
  body: string;
  attachmentBuffer: Buffer | null;
  attachmentFileName: string;
}): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(16)}`;

  let mime = [
    `From: Abbas Saifee <${options.from}>`,
    `To: ${options.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    options.body,
    "",
  ];

  if (options.attachmentBuffer) {
    mime.push(
      `--${boundary}`,
      `Content-Type: application/pdf; name="${options.attachmentFileName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${options.attachmentFileName}"`,
      "",
      options.attachmentBuffer.toString("base64"),
      ""
    );
  }

  mime.push(`--${boundary}--`);

  const rawString = mime.join("\r\n");
  // Base64url encode for Gmail API
  return Buffer.from(rawString)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
