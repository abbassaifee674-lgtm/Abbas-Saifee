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
import { saveFirestoreLeads, saveFirestoreRunLog } from "../firebase/server_store";

export async function verifyApplyUrl(url: string): Promise<boolean> {
  if (!url || !url.startsWith("http")) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    return res.status < 400;
  } catch {
    // Fallback: fast GET with 0-100 range header
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0",
          Range: "bytes=0-100",
        },
        redirect: "follow",
      });
      clearTimeout(timeout);
      return res.status < 400;
    } catch {
      return false;
    }
  }
}

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
    trigger: "manual" | "cron" = "manual",
    options?: { maxJobsToProcess?: number; sourceFilter?: string[]; countryFilter?: string[] }
  ): Promise<{ newLeads: JobLead[]; log: RunLog }> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const rawJobs: RawJob[] = [];
    const sourcesQueried: string[] = [];

    const targetCountries = options?.countryFilter || settings.targetCountries;
    const targetKeywords = settings.targetJobTitles;

    // 1. Fetch from configured adapters
    for (const adapter of this.adapters) {
      if (options?.sourceFilter && !options.sourceFilter.includes(adapter.name)) {
        continue;
      }

      if (!adapter.isConfigured()) {
        continue;
      }

      sourcesQueried.push(adapter.name);
      try {
        const jobs = await adapter.fetchJobs(targetKeywords, targetCountries);
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
    const maxProcess = options?.maxJobsToProcess || 20;

    const candidateJobs = uniqueRawJobs.slice(0, maxProcess);

    for (const raw of candidateJobs) {
      try {
        // Step A: Real link validation
        const isUrlWorking = await verifyApplyUrl(raw.applyUrl);

        // Step B: Evaluate candidate match via Gemini AI
        const match = await scoreJobMatch(raw.title, raw.company, raw.description, profile);

        if (match.matchScore >= minScore) {
          // Step C: Discover verified or predicted contact email
          const contact = await findCompanyContact(raw.company, raw.applyUrl, raw.description);

          // Step D: Generate tailored application draft with fact-checking
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
            applyUrlVerified: isUrlWorking,
            contactEmail: contact.email || raw.contactEmail,
            contactStatus: contact.contactStatus,
            source: raw.source,
            postedDate: raw.postedDate,
            salary: raw.salary,
            matchScore: match.matchScore,
            matchReasons: match.matchReasons,
            missingSkills: match.missingSkills,
            factCheckWarning: draft.factCheckWarning,
            status: "New",
            emailSubject: draft.subject,
            emailBody: draft.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          qualifiedLeads.push(lead);
        }

        // Pacing delay to stay well under Gemini rate limits
        await new Promise((r) => setTimeout(r, 400));
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

    // Save to Cloud Firestore
    try {
      await saveFirestoreLeads(qualifiedLeads);
      await saveFirestoreRunLog(log);
    } catch (e) {
      console.warn("Could not save to Firestore, local store will retain:", e);
    }

    return { newLeads: qualifiedLeads, log };
  }
}
