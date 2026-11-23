import { JobLead, RunLog, UserProfile, UserSettings } from "@/types";
import { RawJob, JobSourceAdapter } from "./types";
import { AdzunaAdapter } from "./adapters/adzuna";
import { JoobleAdapter } from "./adapters/jooble";
import { RemotiveAdapter } from "./adapters/remotive";
import { ArbeitnowAdapter } from "./adapters/arbeitnow";
import { TheMuseAdapter } from "./adapters/themuse";
import { findCompanyContact } from "./email_finder";
import { scoreJobMatch } from "../ai/matcher";
import { generateApplicationEmail } from "../ai/email_writer";

export class JobHunterEngine {
  private adapters: JobSourceAdapter[];

  constructor() {
    this.adapters = [
      new AdzunaAdapter(),
      new JoobleAdapter(),
      new ArbeitnowAdapter(),
      new RemotiveAdapter(),
      new TheMuseAdapter(),
    ];
  }

  async run(
    profile: UserProfile,
    settings: UserSettings,
    existingLeads: JobLead[],
    trigger: "manual" | "cron" = "manual"
  ): Promise<{ newLeads: JobLead[]; log: RunLog }> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const rawJobs: RawJob[] = [];
    const sourcesQueried: string[] = [];

    // 1. Fetch from all configured adapters
    for (const adapter of this.adapters) {
      if (!adapter.isConfigured()) {
        continue;
      }
      sourcesQueried.push(adapter.name);
      try {
        const jobs = await adapter.fetchJobs(settings.targetJobTitles, settings.targetCountries);
        rawJobs.push(...jobs);
      } catch (err: any) {
        errors.push(`${adapter.name} error: ${err.message || err}`);
      }
    }

    // 2. Filter out jobs older than 14 days
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentJobs = rawJobs.filter((j) => {
      if (!j.postedDate) return true;
      const date = new Date(j.postedDate);
      return !isNaN(date.getTime()) ? date >= fourteenDaysAgo : true;
    });

    // 3. Deduplicate against existing leads (company + title + country) and within current batch
    const existingKeys = new Set(
      existingLeads.map((l) => `${l.company.toLowerCase().trim()}|${l.title.toLowerCase().trim()}|${l.country.toLowerCase().trim()}`)
    );

    const uniqueRawJobs: RawJob[] = [];
    const seenBatchKeys = new Set<string>();

    for (const job of recentJobs) {
      const key = `${job.company.toLowerCase().trim()}|${job.title.toLowerCase().trim()}|${job.country.toLowerCase().trim()}`;
      if (!existingKeys.has(key) && !seenBatchKeys.has(key)) {
        seenBatchKeys.add(key);
        uniqueRawJobs.push(job);
      }
    }

    // 4. Match scoring & qualification
    const qualifiedLeads: JobLead[] = [];
    const minScore = settings.minMatchScore || 60;

    // Limit batch per run to 25 to respect free tier rate limits
    const candidateJobs = uniqueRawJobs.slice(0, 25);

    for (const raw of candidateJobs) {
      try {
        // Evaluate candidate match
        const match = await scoreJobMatch(raw.title, raw.company, raw.description, profile);

        if (match.matchScore >= minScore) {
          // Find contact email
          const contact = await findCompanyContact(raw.company, raw.applyUrl, raw.description);

          // Generate personalized draft email
          const draft = await generateApplicationEmail(
            raw.title,
            raw.company,
            raw.country,
            raw.description,
            profile,
            settings
          );

          const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

          const lead: JobLead = {
            id: leadId,
            title: raw.title,
            company: raw.company,
            country: raw.country,
            city: raw.city,
            description: raw.description,
            applyUrl: raw.applyUrl,
            contactEmail: contact.email || raw.contactEmail,
            contactStatus: contact.contactStatus,
            source: raw.source,
            postedDate: raw.postedDate,
            salary: raw.salary,
            matchScore: match.matchScore,
            matchReasons: match.matchReasons,
            missingSkills: match.missingSkills,
            status: "New",
            emailSubject: draft.subject,
            emailBody: draft.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          qualifiedLeads.push(lead);
        }

        // Slight 300ms pause to respect free-tier AI API pacing
        await new Promise((r) => setTimeout(r, 300));
      } catch (err: any) {
        errors.push(`Error evaluating job "${raw.title}" at "${raw.company}": ${err.message || err}`);
      }
    }

    const log: RunLog = {
      id: `log_${Date.now()}`,
      timestamp: startTime,
      trigger,
      sourcesQueried,
      jobsFetched: rawJobs.length,
      jobsQualified: qualifiedLeads.length,
      jobsSaved: qualifiedLeads.length,
      errors,
      status: errors.length === 0 ? "success" : qualifiedLeads.length > 0 ? "partial_success" : "failed",
    };

    return { newLeads: qualifiedLeads, log };
  }
}
