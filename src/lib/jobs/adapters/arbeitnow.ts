import { JobSourceAdapter, RawJob } from "../types";

export class ArbeitnowAdapter implements JobSourceAdapter {
  name = "Arbeitnow";

  // Completely free open API for European & remote jobs
  isConfigured(): boolean {
    return true;
  }

  async fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]> {
    const results: RawJob[] = [];
    try {
      const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
      if (!res.ok) return [];
      const data = await res.json();

      const kwRegex = new RegExp(keywords.join("|"), "i");

      for (const item of data.data || []) {
        const text = `${item.title} ${item.description || ""}`;
        if (kwRegex.test(text) || /procurement|sourcing|buyer|purchasing|supply chain|engineer/i.test(text)) {
          // Check if matches targeted country or Europe
          const matchedCountry = countries.find(
            (c) => item.location?.toLowerCase().includes(c.toLowerCase())
          ) || item.location || "Germany";

          results.push({
            title: item.title,
            company: item.company_name,
            country: matchedCountry,
            city: item.location,
            description: item.description?.replace(/<\/?[^>]+(>|$)/g, "") || "",
            applyUrl: item.url,
            source: "Arbeitnow",
            postedDate: new Date(item.created_at * 1000).toISOString(),
            salary: undefined,
          });
        }
      }
    } catch (e) {
      console.warn("Arbeitnow fetch error:", e);
    }
    return results;
  }
}
