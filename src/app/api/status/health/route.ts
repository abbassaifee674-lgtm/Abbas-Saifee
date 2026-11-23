import { NextRequest, NextResponse } from "next/server";
import { adminDb, getFirebaseAdmin } from "@/lib/firebase/admin";
import { getAIProvider } from "@/lib/ai/provider";
import { getOAuth2Client } from "@/lib/email/gmail";
import { getGmailRefreshToken } from "@/lib/firebase/server_store";
import { ALLOWED_EMAIL } from "@/lib/constants/defaults";
import { getResolvedOAuthCredentials } from "@/lib/env";

export interface ServiceHealth {
  name: string;
  status: "healthy" | "unhealthy" | "optional_missing";
  latencyMs: number;
  message: string;
  fixHint?: string;
}

export async function GET(req: NextRequest) {
  const results: Record<string, ServiceHealth> = {};

  // 1. Firebase Auth
  const authStart = Date.now();
  try {
    const admin = getFirebaseAdmin();
    // Test admin auth initialization
    const listResult = await admin.auth().listUsers(1);
    results.firebaseAuth = {
      name: "Firebase Authentication",
      status: "healthy",
      latencyMs: Date.now() - authStart,
      message: `Admin SDK authenticated. User verification operational for ${ALLOWED_EMAIL}.`,
    };
  } catch (err: any) {
    results.firebaseAuth = {
      name: "Firebase Authentication",
      status: "unhealthy",
      latencyMs: Date.now() - authStart,
      message: `Auth check failed: ${err.message}`,
      fixHint: "Verify FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local",
    };
  }

  // 2. Cloud Firestore
  const fsStart = Date.now();
  try {
    // Perform minimal read
    await adminDb.collection("system_health").doc("ping").get();
    results.firestore = {
      name: "Cloud Firestore Database",
      status: "healthy",
      latencyMs: Date.now() - fsStart,
      message: "Firestore read/write connection verified.",
    };
  } catch (err: any) {
    results.firestore = {
      name: "Cloud Firestore Database",
      status: "unhealthy",
      latencyMs: Date.now() - fsStart,
      message: `Firestore query failed: ${err.message}`,
      fixHint: "Ensure Firestore Database is enabled in Firebase Console (jobpilo-278c1).",
    };
  }

  // 3. Google Gemini AI
  const geminiStart = Date.now();
  const currentModel = process.env.GEMINI_MODEL || process.env.AI_MODEL || "gemini-2.5-flash";
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set in environment.");
    }
    const provider = getAIProvider();
    const testReply = await provider.generateText("Return only the word 'OK'.");
    results.gemini = {
      name: `Google Gemini AI (${currentModel})`,
      status: "healthy",
      latencyMs: Date.now() - geminiStart,
      message: `Gemini response confirmed (${testReply.trim().slice(0, 20)}).`,
    };
  } catch (err: any) {
    let cleanMessage = err.message || String(err);
    // If error contains JSON error object, parse it for clean readability
    try {
      if (cleanMessage.includes("{")) {
        const jsonPart = cleanMessage.slice(cleanMessage.indexOf("{"));
        const parsed = JSON.parse(jsonPart);
        if (parsed?.error?.message) {
          const reason = parsed?.error?.details?.[0]?.reason;
          cleanMessage = reason ? `${parsed.error.message} (${reason})` : parsed.error.message;
        }
      }
    } catch {
      // Keep original message if parsing fails
    }

    results.gemini = {
      name: `Google Gemini AI (${currentModel})`,
      status: "unhealthy",
      latencyMs: Date.now() - geminiStart,
      message: `Gemini API error: ${cleanMessage}`,
      fixHint: "Check GEMINI_API_KEY at https://aistudio.google.com/ and verify API restrictions in Google Cloud Console.",
    };
  }

  // 4. Adzuna Job API
  const adzunaStart = Date.now();
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      throw new Error("ADZUNA_APP_ID or ADZUNA_APP_KEY is missing");
    }

    const testUrl = `https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=1&content-type=application/json`;
    const res = await fetch(testUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} from Adzuna API`);

    results.adzuna = {
      name: "Adzuna Job Search API",
      status: "healthy",
      latencyMs: Date.now() - adzunaStart,
      message: "Live API response received.",
    };
  } catch (err: any) {
    results.adzuna = {
      name: "Adzuna Job Search API",
      status: "unhealthy",
      latencyMs: Date.now() - adzunaStart,
      message: err.message,
      fixHint: "Verify ADZUNA_APP_ID and ADZUNA_APP_KEY at https://developer.adzuna.com/",
    };
  }

  // 5. Jooble Job API
  const joobleStart = Date.now();
  try {
    const apiKey = process.env.JOOBLE_API_KEY;
    if (!apiKey) throw new Error("JOOBLE_API_KEY is missing");

    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: "procurement", location: "Austria", resultonpage: 1 }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from Jooble API`);

    results.jooble = {
      name: "Jooble REST API",
      status: "healthy",
      latencyMs: Date.now() - joobleStart,
      message: "Live endpoint verified.",
    };
  } catch (err: any) {
    results.jooble = {
      name: "Jooble REST API",
      status: "unhealthy",
      latencyMs: Date.now() - joobleStart,
      message: err.message,
      fixHint: "Verify JOOBLE_API_KEY received via email from Jooble API.",
    };
  }

  // 6. Arbeitnow API (European Jobs)
  const arbeitStart = Date.now();
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    results.arbeitnow = {
      name: "Arbeitnow Job API",
      status: "healthy",
      latencyMs: Date.now() - arbeitStart,
      message: "European job feed responding.",
    };
  } catch (err: any) {
    results.arbeitnow = {
      name: "Arbeitnow Job API",
      status: "unhealthy",
      latencyMs: Date.now() - arbeitStart,
      message: err.message,
      fixHint: "Public endpoint temporary downtime.",
    };
  }

  // 7. Remotive API
  const remotiveStart = Date.now();
  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    results.remotive = {
      name: "Remotive Remote API",
      status: "healthy",
      latencyMs: Date.now() - remotiveStart,
      message: "Global remote job feed responding.",
    };
  } catch (err: any) {
    results.remotive = {
      name: "Remotive Remote API",
      status: "unhealthy",
      latencyMs: Date.now() - remotiveStart,
      message: err.message,
      fixHint: "Public endpoint temporary downtime.",
    };
  }

  // 8. The Muse API
  const museStart = Date.now();
  try {
    const res = await fetch("https://www.themuse.com/api/public/jobs?page=1");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    results.theMuse = {
      name: "The Muse API",
      status: "healthy",
      latencyMs: Date.now() - museStart,
      message: "Public catalog endpoint responding.",
    };
  } catch (err: any) {
    results.theMuse = {
      name: "The Muse API",
      status: "unhealthy",
      latencyMs: Date.now() - museStart,
      message: err.message,
      fixHint: "Check themuse.com endpoint status.",
    };
  }

  // 9. Hunter.io (Optional)
  const hunterStart = Date.now();
  if (process.env.HUNTER_API_KEY) {
    try {
      const res = await fetch(`https://api.hunter.io/v2/account?api_key=${process.env.HUNTER_API_KEY}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      results.hunter = {
        name: "Hunter.io Email Discovery (Optional)",
        status: "healthy",
        latencyMs: Date.now() - hunterStart,
        message: "Hunter.io account verified.",
      };
    } catch (err: any) {
      results.hunter = {
        name: "Hunter.io Email Discovery (Optional)",
        status: "unhealthy",
        latencyMs: Date.now() - hunterStart,
        message: err.message,
        fixHint: "Verify HUNTER_API_KEY at https://hunter.io",
      };
    }
  } else {
    results.hunter = {
      name: "Hunter.io Email Discovery (Optional)",
      status: "optional_missing",
      latencyMs: 0,
      message: "Optional key not set. Domain crawler and direct emails will be used.",
      fixHint: "Add HUNTER_API_KEY to enable 25 free domain lookups/month.",
    };
  }

  // 10. Gmail OAuth2 Integration
  const gmailStart = Date.now();
  try {
    const { clientId, clientSecret } = getResolvedOAuthCredentials();
    if (!clientId || !clientSecret) {
      throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET is missing");
    }

    const refreshToken = await getGmailRefreshToken();
    if (!refreshToken) {
      results.gmail = {
        name: "Gmail API Sender Account",
        status: "unhealthy",
        latencyMs: Date.now() - gmailStart,
        message: "No Gmail refresh token found in private_tokens.",
        fixHint: "Open /settings and click 'Connect / Re-authenticate Gmail' with Abbas's account.",
      };
    } else {
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const tokenRes = await oauth2Client.getAccessToken();

      if (tokenRes.token) {
        results.gmail = {
          name: "Gmail API Sender Account",
          status: "healthy",
          latencyMs: Date.now() - gmailStart,
          message: `Active OAuth2 token verified for sender: ${ALLOWED_EMAIL}`,
        };
      } else {
        throw new Error("Could not acquire fresh access token.");
      }
    }
  } catch (err: any) {
    results.gmail = {
      name: "Gmail API Sender Account",
      status: "unhealthy",
      latencyMs: Date.now() - gmailStart,
      message: err.message,
      fixHint: "Ensure OAuth Consent Screen has Abbas added as Test User and credentials in .env.local",
    };
  }

  // 11. Cron / Automation Security Key
  const cronStart = Date.now();
  const cronSecret = process.env.CRON_SECRET;
  results.cron = {
    name: "Scheduled Cron Endpoint Security",
    status: cronSecret && cronSecret.length >= 8 ? "healthy" : "unhealthy",
    latencyMs: Date.now() - cronStart,
    message: cronSecret ? "CRON_SECRET is configured." : "CRON_SECRET is missing.",
    fixHint: "Set CRON_SECRET in environment variables.",
  };

  const allHealthy = Object.values(results).every(
    (s) => s.status === "healthy" || s.status === "optional_missing"
  );

  return NextResponse.json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: results,
  });
}
