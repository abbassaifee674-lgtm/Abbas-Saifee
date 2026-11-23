import { adminDb } from "./admin";
import { encryptToken, decryptToken } from "../email/crypto";
import { JobLead, RunLog, UserSettings, UserProfile } from "@/types";
import { DEFAULT_USER_SETTINGS, DEFAULT_USER_PROFILE } from "../constants/defaults";

// Source daily limits (free tier safety bounds)
export const SOURCE_DAILY_LIMITS: Record<string, number> = {
  Adzuna: 200, // actual limit 250/day
  Jooble: 80,  // actual limit 100/day
  Arbeitnow: 500,
  Remotive: 500,
  TheMuse: 500,
};

export interface CronState {
  currentSourceIndex: number;
  currentCountryIndex: number;
  lastRunTimestamp: string;
  totalLeadsFoundLastRun: number;
  status: "idle" | "running" | "completed";
}

/**
 * 1. Sensitive Tokens Store (Collection: private_tokens)
 * Server-only. Browser client rules explicitly forbid all access.
 */
export async function saveGmailRefreshToken(plainRefreshToken: string): Promise<void> {
  const encrypted = encryptToken(plainRefreshToken);
  await adminDb.collection("private_tokens").doc("gmail").set({
    encryptedToken: encrypted,
    updatedAt: new Date().toISOString(),
  });
}

export async function getGmailRefreshToken(): Promise<string | null> {
  // Check Firestore first
  try {
    const doc = await adminDb.collection("private_tokens").doc("gmail").get();
    if (doc.exists) {
      const data = doc.data();
      if (data?.encryptedToken) {
        return decryptToken(data.encryptedToken);
      }
    }
  } catch (err) {
    console.warn("Could not read gmail token from Firestore private_tokens:", err);
  }

  // Fallback to environment variable GMAIL_REFRESH_TOKEN if present
  if (process.env.GMAIL_REFRESH_TOKEN) {
    try {
      return decryptToken(process.env.GMAIL_REFRESH_TOKEN);
    } catch {
      return process.env.GMAIL_REFRESH_TOKEN;
    }
  }

  return null;
}

/**
 * 2. API Call Counters (Collection: api_counters)
 * Tracks per-source daily call counts to prevent exceeding free tier quotas.
 */
function getTodayDateKey(): string {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function checkAndIncrementApiCall(
  source: string
): Promise<{ allowed: boolean; currentCount: number; maxLimit: number }> {
  const dateKey = getTodayDateKey();
  const counterRef = adminDb.collection("api_counters").doc(`${dateKey}_${source.toLowerCase()}`);
  const maxLimit = SOURCE_DAILY_LIMITS[source] || 500;

  try {
    const doc = await counterRef.get();
    let currentCount = 0;

    if (doc.exists) {
      currentCount = doc.data()?.count || 0;
    }

    if (currentCount >= maxLimit) {
      return { allowed: false, currentCount, maxLimit };
    }

    // Increment counter
    await counterRef.set(
      {
        source,
        date: dateKey,
        count: currentCount + 1,
        lastCalledAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { allowed: true, currentCount: currentCount + 1, maxLimit };
  } catch (err) {
    console.warn(`Counter tracking error for ${source}:`, err);
    // Allow graceful fallback if Firestore fails
    return { allowed: true, currentCount: 0, maxLimit };
  }
}

export async function getDailyApiCounters(): Promise<Record<string, number>> {
  const dateKey = getTodayDateKey();
  const result: Record<string, number> = {};

  try {
    const snapshot = await adminDb
      .collection("api_counters")
      .where("date", "==", dateKey)
      .get();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.source && typeof data.count === "number") {
        result[data.source] = data.count;
      }
    });
  } catch (e) {
    console.warn("Failed to fetch daily API counters:", e);
  }

  return result;
}

/**
 * 3. Batch Cron State Store (Collection: cron_state)
 * Stores progress so batch runs resume without hitting Netlify function timeouts.
 */
export async function getCronState(): Promise<CronState> {
  const defaultState: CronState = {
    currentSourceIndex: 0,
    currentCountryIndex: 0,
    lastRunTimestamp: new Date().toISOString(),
    totalLeadsFoundLastRun: 0,
    status: "idle",
  };

  try {
    const doc = await adminDb.collection("cron_state").doc("active").get();
    if (doc.exists) {
      return { ...defaultState, ...(doc.data() as CronState) };
    }
  } catch (err) {
    console.warn("Could not read cron_state:", err);
  }

  return defaultState;
}

export async function updateCronState(update: Partial<CronState>): Promise<void> {
  try {
    await adminDb.collection("cron_state").doc("active").set(
      {
        ...update,
        lastUpdated: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not update cron_state:", err);
  }
}

/**
 * 4. Leads Persistence in Cloud Firestore (Collection: leads)
 */
export async function getFirestoreLeads(): Promise<JobLead[]> {
  try {
    const snapshot = await adminDb.collection("leads").orderBy("createdAt", "desc").get();
    const leads: JobLead[] = [];
    snapshot.forEach((doc) => {
      leads.push(doc.data() as JobLead);
    });
    return leads;
  } catch (e) {
    console.warn("Could not fetch leads from Firestore:", e);
    return [];
  }
}

export async function saveFirestoreLead(lead: JobLead): Promise<void> {
  try {
    await adminDb.collection("leads").doc(lead.id).set(lead, { merge: true });
  } catch (e) {
    console.warn(`Could not save lead ${lead.id} to Firestore:`, e);
  }
}

export async function saveFirestoreLeads(leads: JobLead[]): Promise<void> {
  if (leads.length === 0) return;
  try {
    const batch = adminDb.batch();
    for (const lead of leads) {
      const ref = adminDb.collection("leads").doc(lead.id);
      batch.set(ref, lead, { merge: true });
    }
    await batch.commit();
  } catch (e) {
    console.warn("Batch save leads failed:", e);
  }
}

export async function deleteFirestoreLead(leadId: string): Promise<void> {
  try {
    await adminDb.collection("leads").doc(leadId).delete();
  } catch (e) {
    console.warn(`Could not delete lead ${leadId}:`, e);
  }
}

/**
 * 5. Run Logs in Cloud Firestore (Collection: run_logs)
 */
export async function saveFirestoreRunLog(log: RunLog): Promise<void> {
  try {
    await adminDb.collection("run_logs").doc(log.id).set(log);
  } catch (e) {
    console.warn("Could not save run log:", e);
  }
}

export async function getFirestoreRunLogs(): Promise<RunLog[]> {
  try {
    const snap = await adminDb.collection("run_logs").orderBy("timestamp", "desc").limit(25).get();
    const logs: RunLog[] = [];
    snap.forEach((d) => logs.push(d.data() as RunLog));
    return logs;
  } catch (e) {
    console.warn("Could not fetch run logs:", e);
    return [];
  }
}
