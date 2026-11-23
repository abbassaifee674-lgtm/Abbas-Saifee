export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  headline: string;
  experienceYears: number;
  summary: string;
  skills: string[];
  pastTitles: string[];
  education: string[];
  languages: string[];
  certifications: string[];
  cvUrl?: string;
  cvFileName?: string;
  cvUploadedAt?: string;
}

export interface UserSettings {
  allowedEmail: string;
  targetCountries: string[];
  targetJobTitles: string[];
  jobTypeFilters: {
    fullTime: boolean;
    remote: boolean;
    contract: boolean;
    visaSponsorshipPreferred: boolean;
  };
  minMatchScore: number; // default 60
  maxEmailsPerDay: number; // default 20, hard cap 40
  emailTone: "formal" | "friendly";
  emailSignature: string;
  phone: string;
  linkedin: string;
  gmailConnected: boolean;
  gmailConnectedEmail?: string;
  lastFindJobsRun?: string;
}

export type LeadStatus = "New" | "Reviewed" | "Sent" | "Replied" | "Skipped" | "Failed";

export type ContactStatus = "Email found" | "Email guessed (verify)" | "Apply via link only";

export interface JobLead {
  id: string;
  title: string;
  company: string;
  country: string;
  city?: string;
  description: string;
  applyUrl: string;
  contactEmail?: string;
  contactStatus: ContactStatus;
  source: string; // e.g. "Adzuna", "Jooble", "Remotive", "Arbeitnow", "The Muse"
  postedDate: string; // ISO date string
  salary?: string;
  matchScore: number; // 0 - 100
  matchReasons: string[]; // 3 short reasons
  missingSkills: string[];
  applyUrlVerified?: boolean;
  factCheckWarning?: string;
  status: LeadStatus;
  emailSubject: string;
  emailBody: string;
  sentAt?: string;
  gmailMessageId?: string;
  error?: string;
  followUpStatus?: "Pending" | "Sent" | "Not Needed";
  followUpSubject?: string;
  followUpBody?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunLog {
  id: string;
  timestamp: string;
  trigger: "manual" | "cron";
  sourcesQueried: string[];
  jobsFetched: number;
  jobsQualified: number;
  jobsSaved: number;
  errors: string[];
  status: "success" | "partial_success" | "failed";
}

export interface DailySendQuota {
  date: string; // YYYY-MM-DD
  count: number;
  limit: number;
}
