import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/email/gmail";
import { memoryStore } from "@/lib/firebase/mock_store";
import { saveGmailRefreshToken } from "@/lib/firebase/server_store";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "https://abbassaifee.netlify.app";
  const redirectUri = `${origin}/api/auth/gmail/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/settings?gmail_error=${encodeURIComponent(error || "Missing auth code")}`);
  }

  try {
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.refresh_token) {
      // Verify authorized Google account is Abbas's Gmail
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const userEmail = userInfo.data.email || "";

      if (userEmail.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
        return NextResponse.redirect(
          `${origin}/settings?gmail_error=${encodeURIComponent(`Unauthorized Gmail account: ${userEmail}. Only ${ALLOWED_EMAIL} is permitted.`)}`
        );
      }

      // Save encrypted refresh token in server-only Firestore collection private_tokens/gmail
      await saveGmailRefreshToken(tokens.refresh_token);

      memoryStore.updateSettings({
        gmailConnected: true,
        gmailConnectedEmail: userEmail,
      });

      console.log(`[GMAIL AUTH SUCCESS] Abbas authenticated. Token encrypted and saved in private_tokens.`);

      return NextResponse.redirect(`${origin}/settings?gmail_success=true`);
    } else {
      return NextResponse.redirect(`${origin}/settings?gmail_error=No+refresh+token+returned.+Please+revoke+app+access+and+try+again.`);
    }
  } catch (err: any) {
    console.error("Gmail OAuth callback failed:", err);
    return NextResponse.redirect(`${origin}/settings?gmail_error=${encodeURIComponent(err.message)}`);
  }
}
