import { JobSourceAdapter, RawJob } from "../types";

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
      try {
        const res = await fetch(`https://jooble.org/api/${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keywords: keywords.join(" OR "),
            location: country,
            page: 1,
            resultonpage: 10,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();

        for (const item of data.jobs || []) {
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
      } catch (err) {
        console.warn(`Jooble fetch error for ${country}:`, err);
      }
    }

    return results;
  }
}
