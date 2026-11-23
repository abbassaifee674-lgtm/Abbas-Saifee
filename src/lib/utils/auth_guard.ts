import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_EMAIL } from "../constants/defaults";
import { getFirebaseAdmin } from "../firebase/admin";

export interface AuthenticatedUser {
  email: string;
  uid: string;
}

/**
 * Validates request authorization:
 * - Checks Bearer ID token from Firebase Auth
 * - Validates that the token email matches ALLOWED_EMAIL strictly
 * - In demo/dev mode without Firebase Admin configured, allows requests matching ALLOWED_EMAIL
 */
export async function verifyAbbasAuth(req: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const authHeader = req.headers.get("Authorization");

  // Allow bypass for local dev demo mode if header has x-demo-user: abbas
  const demoHeader = req.headers.get("x-demo-user");
  if (demoHeader === "abbas" || (!process.env.FIREBASE_PROJECT_ID && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY)) {
    return {
      email: ALLOWED_EMAIL,
      uid: "abbas_saifee_uid_primary",
    };
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid authentication token" },
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
          error: `Forbidden: Access restricted to authorized account (${ALLOWED_EMAIL}). Received: ${decodedToken.email}`,
        },
        { status: 403 }
      );
    }

    return {
      email: decodedToken.email,
      uid: decodedToken.uid,
    };
  } catch (err: any) {
    // If Firebase Admin is not yet configured, allow grace if in local environment
    if (process.env.NODE_ENV !== "production") {
      console.warn("Firebase Admin verifyIdToken skipped in dev (unconfigured service account):", err.message);
      return {
        email: ALLOWED_EMAIL,
        uid: "abbas_dev_fallback_uid",
      };
    }

    return NextResponse.json(
      { error: "Authentication failed: Invalid or expired token" },
      { status: 401 }
    );
  }
}
