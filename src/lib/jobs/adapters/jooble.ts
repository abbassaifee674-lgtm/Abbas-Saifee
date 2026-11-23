import { JobSourceAdapter, RawJob } from "../types";
import { checkAndIncrementApiCall } from "../../firebase/server_store";

export class JoobleAdapter implements JobSourceAdapter {
  name = "Jooble";

  isConfigured(): boolean {
    return !!process.env.JOOBLE_API_KEY;
  }

  async fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]> {
    if (!this.isConfigured()) return [];

    const apiKey = process.env.JOOBLE_API_KEY;
    const results: RawJob[] = [];

    for (const country of countries.slice(0, 3)) {
      // Rate limit check in Firestore
      const rateCheck = await checkAndIncrementApiCall("Jooble");
      if (!rateCheck.allowed) {
        console.warn(`Jooble daily rate limit reached (${rateCheck.currentCount}/${rateCheck.maxLimit}). Skipping call.`);
        break;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://jooble.org/api/${apiKey}`, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords: keywords.slice(0, 3).join(" OR "),
            location: country,
            page: 1,
            resultonpage: 10,
          }),
        });
        clearTimeout(timeout);

        if (!res.ok) {
          console.warn(`Jooble response status ${res.status} for ${country}`);
          continue;
        }

        const data = await res.json();

        for (const item of data.jobs || []) {
          if (!item.link) continue;

          results.push({
            title: item.title?.replace(/<\/?[^>]+(>|$)/g, "") || "Procurement Specialist",
            company: item.company || "Leading Employer",
            country: country,
            city: item.location,
            description: item.snippet?.replace(/<\/?[^>]+(>|$)/g, "") || "",
            applyUrl: item.link,
            source: "Jooble",
            postedDate: item.updated || new Date().toISOString(),
            salary: item.salary || undefined,
          });
        }
      } catch (err: any) {
        console.warn(`Jooble fetch error for ${country}:`, err.message || err);
      }
    }

    return results;
  }
}
