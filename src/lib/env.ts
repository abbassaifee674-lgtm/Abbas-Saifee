import { z } from "zod";

const envSchema = z.object({
  // Single User Authorization
  ALLOWED_EMAIL: z.string().email().default("abbassaifee674@gmail.com"),
  NEXT_PUBLIC_ALLOWED_EMAIL: z.string().email().default("abbassaifee674@gmail.com"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Mode: production live mode by default; demo mode ONLY if explicitly "true"
  DEMO_MODE: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  NEXT_PUBLIC_DEMO_MODE: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Firebase Client SDK
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, "NEXT_PUBLIC_FIREBASE_API_KEY is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, "NEXT_PUBLIC_FIREBASE_APP_ID is required"),

  // Firebase Admin SDK
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_CLIENT_EMAIL: z.string().email("FIREBASE_CLIENT_EMAIL must be a valid service account email"),
  FIREBASE_PRIVATE_KEY: z.string().min(1, "FIREBASE_PRIVATE_KEY is required"),

  // AI Engine
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  AI_MODEL: z.string().default("gemini-2.0-flash"),

  // Job APIs
  ADZUNA_APP_ID: z.string().min(1, "ADZUNA_APP_ID is required"),
  ADZUNA_APP_KEY: z.string().min(1, "ADZUNA_APP_KEY is required"),
  JOOBLE_API_KEY: z.string().min(1, "JOOBLE_API_KEY is required"),
  HUNTER_API_KEY: z.string().optional(),

  // Google / Gmail OAuth (Accepts either GOOGLE_* or GMAIL_* aliases)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().optional(),

  // Token Encryption Secret
  ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_SECRET: z.string().optional(),

  // Cron Secret
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required to protect cron endpoint"),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  config: Partial<ValidatedEnv>;
}

export function validateEnv(): EnvValidationResult {
  const rawEnv = {
    ALLOWED_EMAIL: process.env.ALLOWED_EMAIL,
    NEXT_PUBLIC_ALLOWED_EMAIL: process.env.NEXT_PUBLIC_ALLOWED_EMAIL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DEMO_MODE: process.env.DEMO_MODE,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_MODEL: process.env.AI_MODEL || "gemini-2.0-flash",
    ADZUNA_APP_ID: process.env.ADZUNA_APP_ID,
    ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY,
    JOOBLE_API_KEY: process.env.JOOBLE_API_KEY,
    HUNTER_API_KEY: process.env.HUNTER_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || process.env.GMAIL_REDIRECT_URI,
    GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET,
    ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || process.env.ENCRYPTION_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  };

  const parsed = envSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    return {
      isValid: false,
      errors,
      config: rawEnv as unknown as Partial<ValidatedEnv>,
    };
  }

  // Check Gmail credentials specifically
  const errors: string[] = [];
  const clientId = parsed.data.GOOGLE_CLIENT_ID || parsed.data.GMAIL_CLIENT_ID;
  const clientSecret = parsed.data.GOOGLE_CLIENT_SECRET || parsed.data.GMAIL_CLIENT_SECRET;
  const encKey = parsed.data.ENCRYPTION_KEY || parsed.data.ENCRYPTION_SECRET;

  if (!clientId) {
    errors.push("GOOGLE_CLIENT_ID (or GMAIL_CLIENT_ID) is missing for Gmail OAuth");
  }
  if (!clientSecret) {
    errors.push("GOOGLE_CLIENT_SECRET (or GMAIL_CLIENT_SECRET) is missing for Gmail OAuth");
  }
  if (!encKey) {
    errors.push("ENCRYPTION_KEY (or ENCRYPTION_SECRET) is missing for token encryption");
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: parsed.data,
  };
}

export function getResolvedOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    process.env.GMAIL_REDIRECT_URI ||
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/gmail/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function getResolvedEncryptionKey(): string {
  return (
    process.env.ENCRYPTION_KEY ||
    process.env.ENCRYPTION_SECRET ||
    "bf680233a4810086295ab44f520fa43174f3bf6847e3bb2ae1020d8bc82a2438"
  );
}

export function isDemoModeActive(): boolean {
  return process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
