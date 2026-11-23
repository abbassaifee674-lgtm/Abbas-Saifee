import { JobSourceAdapter, RawJob } from "../types";

export class TheMuseAdapter implements JobSourceAdapter {
  name = "The Muse";

  // The Muse has a public API that works without key (or optional key)
  isConfigured(): boolean {
    return true;
  }

  async fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]> {
    const results: RawJob[] = [];
    try {
      const category = encodeURIComponent("Purchasing & Procurement");
      const url = `https://www.themuse.com/api/public/jobs?category=${category}&page=1`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      for (const item of data.results || []) {
        const locationName = item.locations?.[0]?.name || "Europe";
        const matchedCountry = countries.find((c) =>
          locationName.toLowerCase().includes(c.toLowerCase())
        ) || locationName;

        results.push({
          title: item.name,
          company: item.company?.name || "Global Enterprise",
          country: matchedCountry,
          city: item.locations?.[0]?.name,
          description: item.contents?.replace(/<\/?[^>]+(>|$)/g, "") || "",
          applyUrl: item.refs?.landing_page || "",
          source: "The Muse",
          postedDate: item.publication_date || new Date().toISOString(),
          salary: undefined,
        });
      }
    } catch (e) {
      console.warn("The Muse fetch error:", e);
    }
    return results;
  }
}
