export interface RawJob {
  title: string;
  company: string;
  country: string;
  city?: string;
  description: string;
  applyUrl: string;
  contactEmail?: string;
  source: string;
  postedDate: string; // ISO string
  salary?: string;
}

export interface JobSourceAdapter {
  name: string;
  isConfigured(): boolean;
  fetchJobs(keywords: string[], countries: string[]): Promise<RawJob[]>;
}
