import { JobSourceAdapter, RawJob } from "../types";

export class RemotiveAdapter implements JobSourceAdapter {
  name = "Remotive";

  // Remotive offers a free public API requiring no API key
  isConfigured(): boolean {
    return true;
  }

  async fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]> {
    const results: RawJob[] = [];
    try {
      // Free public endpoint
      const res = await fetch("https://remotive.com/api/remote-jobs?category=all-others&limit=25");
      if (!res.ok) return [];
      const data = await res.json();

      const kwRegex = new RegExp(keywords.join("|"), "i");

      for (const item of data.jobs || []) {
        const text = `${item.title} ${item.description || ""}`;
        if (kwRegex.test(text) || /procurement|sourcing|buyer|purchasing|supply chain/i.test(text)) {
          results.push({
            title: item.title,
            company: item.company_name,
            country: countries[0] || "Global (Remote)",
            city: "Remote",
            description: item.description?.replace(/<\/?[^>]+(>|$)/g, "") || "",
            applyUrl: item.url,
            source: "Remotive",
            postedDate: item.publication_date || new Date().toISOString(),
            salary: item.salary || undefined,
          });
        }
      }
    } catch (e) {
      console.warn("Remotive fetch error:", e);
    }
    return results;
  }
}
