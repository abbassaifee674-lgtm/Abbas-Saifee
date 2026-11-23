import { JobLead, UserProfile, UserSettings, RunLog } from "@/types";
import { DEFAULT_USER_PROFILE, DEFAULT_USER_SETTINGS } from "../constants/defaults";
import { isDemoModeActive } from "../env";

export const SEED_LEADS: JobLead[] = [
  {
    id: "lead_demo_01",
    title: "Senior Procurement Specialist – Aviation & Fleet",
    company: "Cargolux Airlines International",
    country: "Luxembourg",
    city: "Sandweiler / Luxembourg Airport",
    description: "Cargolux is seeking an experienced Aviation Procurement Specialist to manage high-value aircraft component sourcing, OEM supplier contracts (Boeing, GE), AOG emergency procurement, and Capex budget allocation. Experience in aviation MRO and ERP systems required.",
    applyUrl: "https://www.cargolux.com/careers",
    applyUrlVerified: true,
    contactEmail: "recruitment@cargolux.com",
    contactStatus: "Email found",
    source: "Adzuna",
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "€85,000 - €105,000 / year",
    matchScore: 96,
    matchReasons: [
      "Direct alignment: 6+ yrs aviation MRO parts sourcing and AOG emergency purchases",
      "Proven management of AED 12-15M Capex/Opex budgets and OEM relationships",
      "Holds certified OTAR Part 145/43 Foundation credential"
    ],
    missingSkills: [],
    status: "New",
    emailSubject: "Application: Senior Procurement Specialist – Aviation & Fleet – Abbas Saifee",
    emailBody: `Dear Cargolux Hiring Team,\n\nI am putting forward my background for the Senior Procurement Specialist role at Cargolux.\n\nOver the past 6+ years in aviation procurement at Gulf Aircraft & Engineering Services, I directed end-to-end purchasing for AED 12–15 million in CAPEX and OPEX budgets. My responsibilities centered on global OEM component sourcing, urgent AOG (Aircraft On Ground) emergency shipments, and establishing automated reorder levels in our ERP system that eliminated critical operational delays.\n\nWith an engineering background in Electronics (NED University) and OTAR Part 145/43 certification, I ensure all vendor contracts comply rigorously with aerospace quality standards while driving tangible cost efficiencies. I am based in the UAE and fully prepared to relocate to Luxembourg.\n\nMy complete CV is attached for your review. I would welcome the opportunity to discuss how my aerospace sourcing background aligns with Cargolux's fleet operations.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

class MemoryStore {
  private profile: UserProfile = { ...DEFAULT_USER_PROFILE };
  private settings: UserSettings = { ...DEFAULT_USER_SETTINGS };
  private leads: JobLead[] = [];
  private logs: RunLog[] = [];
  private todaySends: number = 0;

  constructor() {
    // ONLY populate seed leads if DEMO_MODE=true is explicitly set in environment
    if (isDemoModeActive()) {
      this.leads = [...SEED_LEADS];
      this.todaySends = 1;
    }
  }

  getProfile(): UserProfile {
    return this.profile;
  }

  updateProfile(update: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...update };
    return this.profile;
  }

  getSettings(): UserSettings {
    return this.settings;
  }

  updateSettings(update: Partial<UserSettings>): UserSettings {
    this.settings = { ...this.settings, ...update };
    return this.settings;
  }

  getLeads(): JobLead[] {
    return this.leads;
  }

  getLead(id: string): JobLead | undefined {
    return this.leads.find((l) => l.id === id);
  }

  saveLead(lead: JobLead): void {
    const idx = this.leads.findIndex((l) => l.id === lead.id);
    if (idx >= 0) {
      this.leads[idx] = lead;
    } else {
      this.leads.unshift(lead);
    }
  }

  saveLeads(newLeads: JobLead[]): void {
    for (const lead of newLeads) {
      this.saveLead(lead);
    }
  }

  deleteLead(id: string): void {
    this.leads = this.leads.filter((l) => l.id !== id);
  }

  getLogs(): RunLog[] {
    return this.logs;
  }

  addLog(log: RunLog): void {
    this.logs.unshift(log);
  }

  getDailySends(): number {
    return this.todaySends;
  }

  incrementDailySends(): number {
    this.todaySends += 1;
    return this.todaySends;
  }

  resetSeedData(): void {
    if (isDemoModeActive()) {
      this.leads = JSON.parse(JSON.stringify(SEED_LEADS));
      this.todaySends = 1;
    } else {
      this.leads = [];
      this.todaySends = 0;
    }
  }
}

declare global {
  var __jobpilot_store__: MemoryStore | undefined;
}

export const memoryStore = global.__jobpilot_store__ || new MemoryStore();
if (process.env.NODE_ENV !== "production") {
  global.__jobpilot_store__ = memoryStore;
}
