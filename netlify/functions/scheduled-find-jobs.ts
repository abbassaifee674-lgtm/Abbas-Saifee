import type { Handler, HandlerEvent, HandlerContext, schedule } from "@netlify/functions";

/**
 * JobPilot – Netlify Scheduled Function
 * Runs twice daily at 08:00 UTC and 18:00 UTC.
 * Triggers the job-finding engine via the internal API route.
 *
 * To test locally:  netlify functions:invoke scheduled-find-jobs
 */
const scheduledHandler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const baseUrl = process.env.NETLIFY_URL || process.env.URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[Cron] CRON_SECRET not set – aborting");
    return { statusCode: 500, body: JSON.stringify({ error: "CRON_SECRET not configured" }) };
  }

  console.log(`[Cron] Starting job-hunt cycle at ${new Date().toISOString()}`);

  try {
    const res = await fetch(`${baseUrl}/api/jobs/find`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
        "x-cron-trigger": "netlify-schedule",
      },
      signal: AbortSignal.timeout(55_000),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Cron] Job-find API returned error:", data);
      return { statusCode: res.status, body: JSON.stringify({ error: data.error || "Unknown error" }) };
    }

    console.log(
      `[Cron] Done — ${data.newLeadsCount ?? 0} new leads found. Log ID: ${data.log?.id ?? "n/a"}`
    );
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, newLeadsCount: data.newLeadsCount ?? 0 }),
    };
  } catch (err: any) {
    console.error("[Cron] Fetch error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// Wrap with schedule decorator — runs at 08:00 and 18:00 UTC every day
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { schedule: netlifySchedule } = require("@netlify/functions");
export const handler: Handler = netlifySchedule("0 8,18 * * *", scheduledHandler);
