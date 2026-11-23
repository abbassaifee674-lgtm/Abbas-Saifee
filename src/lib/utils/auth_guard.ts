import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_EMAIL } from "../constants/defaults";
import { getFirebaseAdmin } from "../firebase/admin";
import { isDemoModeActive } from "../env";

export interface AuthenticatedUser {
  email: string;
  uid: string;
}

/**
 * Validates request authorization:
 * - Checks Bearer ID token from Firebase Auth
 * - Validates that the token email matches ALLOWED_EMAIL strictly
 * - Returns HTTP 401 for missing/invalid token
 * - Returns HTTP 403 for non-allowed email
 */
export async function verifyAbbasAuth(req: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const isDemo = isDemoModeActive();
  const demoHeader = req.headers.get("x-demo-user");

  // Allow Netlify Scheduled Function / internal cron calls via CRON_SECRET header
  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret && cronSecret === process.env.CRON_SECRET) {
    return {
      email: ALLOWED_EMAIL,
      uid: "cron_service_account",
    };
  }

  // Only allow bypass when DEMO_MODE=true is explicitly set in environment
  if (isDemo && demoHeader === "abbas") {
    return {
      email: ALLOWED_EMAIL,
      uid: "abbas_saifee_demo_uid",
    };
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // In local dev, if demo header was passed and DEMO_MODE was enabled
    if (isDemo) {
      return {
        email: ALLOWED_EMAIL,
        uid: "abbas_saifee_local_uid",
      };
    }

    return NextResponse.json(
      { error: "Unauthorized: Missing authentication token" },
      { status: 401 }
    );
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken.email || decodedToken.email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Forbidden: Access restricted strictly to authorized user (${ALLOWED_EMAIL}). Received: ${decodedToken.email}`,
        },
        { status: 403 }
      );
    }

    return {
      email: decodedToken.email,
      uid: decodedToken.uid,
    };
  } catch (err: any) {
    console.error("Firebase ID Token verification error:", err.message);

    return NextResponse.json(
      { error: "Authentication failed: Invalid or expired Firebase ID token" },
      { status: 401 }
    );
  }
}
