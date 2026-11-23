import { JobSourceAdapter, RawJob } from "../types";

// Country ISO 2-letter mapping for Adzuna supported endpoints
const ADZUNA_COUNTRY_MAP: Record<string, string> = {
  australia: "au",
  austria: "at",
  germany: "de",
  france: "fr",
  italy: "it",
  "new zealand": "nz",
  "south africa": "za",
  singapore: "sg",
  malaysia: "my",
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

    // Filter to supported Adzuna countries or default to gb/de/at/au
    for (const country of countries.slice(0, 3)) {
      const code = ADZUNA_COUNTRY_MAP[country.toLowerCase()] || "de";
      const query = encodeURIComponent(keywords[0] || "procurement");
      const url = `https://api.adzuna.com/v1/api/jobs/${code}/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&results_per_page=15&content-type=application/json`;

      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) continue;
        const data = await res.json();

        for (const item of data.results || []) {
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
      } catch (e) {
        console.warn(`Adzuna fetch error for ${country}:`, e);
      }
    }

    return results;
  }
}
