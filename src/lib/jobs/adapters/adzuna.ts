import { JobSourceAdapter, RawJob } from "../types";
import { checkAndIncrementApiCall } from "../../firebase/server_store";

// Official supported country codes for Adzuna endpoints
const ADZUNA_SUPPORTED_COUNTRIES: Record<string, string> = {
  austria: "at",
  australia: "au",
  germany: "de",
  france: "fr",
  "united kingdom": "gb",
  uk: "gb",
  italy: "it",
  netherlands: "nl",
  "new zealand": "nz",
  poland: "pl",
  russia: "ru",
  singapore: "sg",
  "united states": "us",
  usa: "us",
  "south africa": "za",
};

export class AdzunaAdapter implements JobSourceAdapter {
  name = "Adzuna";

  isConfigured(): boolean {
    return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  async fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]> {
    if (!this.isConfigured()) return [];

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const results: RawJob[] = [];

    // Filter to supported Adzuna countries only; skip unsupported ones gracefully
    const supportedTargetCountries = countries.filter(
      (c) => !!ADZUNA_SUPPORTED_COUNTRIES[c.toLowerCase().trim()]
    );

    if (supportedTargetCountries.length === 0) {
      return [];
    }

    for (const country of supportedTargetCountries.slice(0, 3)) {
      const code = ADZUNA_SUPPORTED_COUNTRIES[country.toLowerCase().trim()];
      if (!code) continue;

      // Rate limit check in Firestore
      const rateCheck = await checkAndIncrementApiCall("Adzuna");
      if (!rateCheck.allowed) {
        console.warn(`Adzuna daily rate limit reached (${rateCheck.currentCount}/${rateCheck.maxLimit}). Skipping call.`);
        break;
      }

      const query = encodeURIComponent(keywords[0] || "procurement");
      const url = `https://api.adzuna.com/v1/api/jobs/${code}/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&results_per_page=15&content-type=application/json`;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(timeout);

        if (!res.ok) {
          console.warn(`Adzuna API response not ok for ${country} (${res.status})`);
          continue;
        }

        const data = await res.json();

        for (const item of data.results || []) {
          if (!item.redirect_url) continue;

          results.push({
            title: item.title?.replace(/<\/?[^>]+(>|$)/g, "") || "Procurement Specialist",
            company: item.company?.display_name || "Enterprise Employer",
            country: country,
            city: item.location?.area?.[0] || item.location?.display_name,
            description: item.description?.replace(/<\/?[^>]+(>|$)/g, "") || "",
            applyUrl: item.redirect_url,
            source: "Adzuna",
            postedDate: item.created || new Date().toISOString(),
            salary: item.salary_min ? `${item.salary_min} - ${item.salary_max || item.salary_min}` : undefined,
          });
        }
      } catch (e: any) {
        console.warn(`Adzuna fetch error for ${country}:`, e.message || e);
      }
    }

    return results;
  }
}
