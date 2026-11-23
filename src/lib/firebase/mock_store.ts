import { JobLead, UserProfile, UserSettings, RunLog } from "@/types";
import { DEFAULT_USER_PROFILE, DEFAULT_USER_SETTINGS } from "../constants/defaults";

export const SEED_LEADS: JobLead[] = [
  {
    id: "lead_cargolux_01",
    title: "Senior Procurement Specialist – Aviation & Fleet",
    company: "Cargolux Airlines International",
    country: "Luxembourg",
    city: "Sandweiler / Luxembourg Airport",
    description: "Cargolux is seeking an experienced Aviation Procurement Specialist to manage high-value aircraft component sourcing, OEM supplier contracts (Boeing, GE), AOG emergency procurement, and Capex budget allocation. Experience in aviation MRO and ERP systems required.",
    applyUrl: "https://www.cargolux.com/careers/procurement-specialist",
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
  },
  {
    id: "lead_facc_02",
    title: "Technical Buyer & Sourcing Specialist (Aerospace)",
    company: "FACC AG",
    country: "Austria",
    city: "Ried im Innkreis",
    description: "FACC AG develops and manufactures advanced composite aerospace components. We are looking for a Technical Buyer to oversee mechanical/electrical supplier agreements, optimize inventory levels, and handle SAP MM purchasing operations.",
    applyUrl: "https://www.facc.com/en/Career/Job-Openings",
    contactEmail: "jobs@facc.com",
    contactStatus: "Email found",
    source: "Arbeitnow",
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "€65,000 - €78,000 / year",
    matchScore: 92,
    matchReasons: [
      "In-depth expertise in SAP PRO HANA MM module and BOM procurement",
      "Dual background: BE Electronics engineering + technical aerospace procurement",
      "Demonstrated record of reducing supplier line project costs by up to 85%"
    ],
    missingSkills: ["German (basic/intermediate preferred)"],
    status: "New",
    emailSubject: "Application: Technical Buyer & Sourcing Specialist – Abbas Saifee",
    emailBody: `Dear FACC AG Sourcing Team,\n\nI am writing to express my candidacy for the Technical Buyer role at FACC AG.\n\nWith 6+ years specializing in technical procurement and engineering sourcing, I have managed multi-million dollar vendor contracts across aerospace and manufacturing environments. During my tenure at Gulf Aircraft & Engineering Services and PepsiCo, I leveraged SAP PRO HANA (MM module) to oversee mechanical and electrical spare parts procurement, successfully reducing project costs by up to 85% through aggressive vendor negotiations.\n\nHolding a degree in Electronics Engineering alongside OTAR aerospace foundation compliance, I bridge technical requirements and commercial negotiations effectively. I am available to relocate to Austria.\n\nPlease find my CV attached. I look forward to connecting.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_sia_03",
    title: "Procurement Specialist – Aircraft Maintenance & Spares",
    company: "SIA Engineering Company",
    country: "Singapore",
    city: "Changi",
    description: "Manage strategic procurement of aircraft spares, engine parts, and maintenance equipment for major commercial carriers. Coordinate international OEM logistics and ensure timely availability under strict SLA constraints.",
    applyUrl: "https://www.siaec.com.sg/careers",
    contactEmail: "hr_procurement@singaporeair.com.sg",
    contactStatus: "Email guessed (verify)",
    source: "Jooble",
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "S$7,500 - S$9,200 / month",
    matchScore: 94,
    matchReasons: [
      "Hands-on experience sourcing OEM certified rotables and expendables",
      "Direct experience managing international freight forwarding & customs",
      "Awarded Director General Certificate of Recognition for cost savings"
    ],
    missingSkills: [],
    status: "New",
    emailSubject: "Procurement Specialist Opening – Abbas Saifee Application",
    emailBody: `Dear SIA Engineering Hiring Team,\n\nI am reaching out regarding the Procurement Specialist opening within your Aircraft Maintenance division.\n\nThroughout my 6 years in aviation and technical purchasing at Gulf Aircraft & Engineering Services, I directed Capex and Opex allocations totaling AED 12–15 million. My daily focus was ensuring zero aircraft downtime by streamlining OEM vendor pipelines, expediting AOG shipments across global timezones, and implementing minimum safety stock thresholds in ERP.\n\nMy engineering background coupled with OTAR aviation standards allows me to handle complex technical specifications with precision. I am eager to relocate to Singapore to contribute to SIAEC's world-class operations.\n\nI have attached my complete CV and look forward to speaking with your team.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_lufthansa_04",
    title: "Strategic Sourcing Manager – Components",
    company: "Lufthansa Technik AG",
    country: "Germany",
    city: "Hamburg / Frankfurt",
    description: "Lufthansa Technik is looking for a Strategic Sourcing Manager to manage European and international suppliers, negotiate master service agreements, and drive procurement digitization.",
    applyUrl: "https://www.lufthansa-technik.com/careers/jobs",
    contactEmail: undefined,
    contactStatus: "Apply via link only",
    source: "The Muse",
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "€75,000 - €90,000",
    matchScore: 88,
    matchReasons: [
      "6+ years experience negotiating vendor SLAs and master supply agreements",
      "Extensive aerospace MRO procurement and OEM partner management",
      "Inventory optimization via ERP automation"
    ],
    missingSkills: ["German language (professional)"],
    status: "New",
    emailSubject: "Application: Strategic Sourcing Manager – Abbas Saifee",
    emailBody: `Dear Lufthansa Technik Sourcing Team,\n\nI am writing to submit my application for the Strategic Sourcing Manager position.\n\nHaving managed AED 12-15M in procurement budgets at Gulf Aircraft & Engineering Services, I have led strategic sourcing initiatives across international OEM aerospace suppliers. My work focused on securing favorable commercial terms, minimizing supply chain vulnerabilities, and integrating automated inventory control mechanisms.\n\nI hold an engineering degree in Electronics and OTAR Part 145/43 compliance credentials. I am fully available to relocate to Germany.\n\nMy CV is attached. I would appreciate the chance to discuss how my sourcing expertise can add value to Lufthansa Technik.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_qantas_05",
    title: "Purchasing Officer – Engineering & Maintenance",
    company: "Qantas Airways",
    country: "Australia",
    city: "Sydney / Mascot",
    description: "Join the Qantas Engineering procurement team managing rotable exchanges, consumable inventories, and critical supplier delivery schedules across domestic and international ports.",
    applyUrl: "https://www.qantas.com/au/en/about-us/careers.html",
    contactEmail: "recruitment@qantas.com.au",
    contactStatus: "Email found",
    source: "Adzuna",
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "AU$85,000 - AU$105,000",
    matchScore: 91,
    matchReasons: [
      "Direct experience managing rotable exchanges and AOG emergency sourcing",
      "Strong track record in Wings ERP and SAP inventory control",
      "Demonstrated ability to meet rapid turnaround times for flight operations"
    ],
    missingSkills: [],
    status: "Sent",
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    gmailMessageId: "msg_qantas_demo_1892837",
    emailSubject: "Purchasing Officer (Engineering & Maintenance) – Abbas Saifee",
    emailBody: `Dear Qantas Engineering Team,\n\nI am applying for the Purchasing Officer role within Qantas Engineering & Maintenance.\n\nAt Gulf Aircraft & Engineering Services, I was responsible for continuous purchasing operations across AED 12–15 million in Capex/Opex spend. Sourcing certified aircraft parts under rapid turnaround constraints was my core focus, alongside tracking international air freight and customs clearance.\n\nWith an Electronics Engineering degree and OTAR Part 145/43 compliance credentials, I bring both technical literacy and commercial diligence. I am eager to relocate to Australia to support Qantas's engineering operations.\n\nMy CV is attached. I look forward to the opportunity to speak with your team.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "lead_boeing_06",
    title: "Procurement Specialist – Global Supply Chain",
    company: "Boeing Australia",
    country: "Australia",
    city: "Brisbane",
    description: "Support defense and commercial aviation supply chain operations. Drive procurement governance, supplier compliance, and strategic supplier relationship management.",
    applyUrl: "https://jobs.boeing.com/australia",
    contactEmail: "australia.careers@boeing.com",
    contactStatus: "Email found",
    source: "Remotive",
    postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    salary: "AU$90,000 - AU$110,000",
    matchScore: 89,
    matchReasons: [
      "Aerospace procurement background with strict regulatory compliance",
      "Experience handling AED 12-15M budgets and international supplier audits",
      "Cross-functional collaboration with engineering and quality managers"
    ],
    missingSkills: [],
    status: "Sent",
    sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    gmailMessageId: "msg_boeing_demo_772189",
    followUpStatus: "Pending",
    followUpSubject: "Following up: Procurement Specialist Opening – Abbas Saifee",
    followUpBody: `Hi Boeing Australia Careers Team,\n\nI wanted to follow up on my application submitted last week for the Procurement Specialist position.\n\nWith 6+ years managing AED 12-15M in aviation and engineering procurement, I am very interested in contributing to Boeing's global supply chain resilience.\n\nI have attached my CV once again for easy reference and would welcome a brief discussion at your convenience.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    emailSubject: "Procurement Specialist – Global Supply Chain – Abbas Saifee",
    emailBody: `Dear Boeing Australia Recruitment Team,\n\nI am pleased to submit my application for the Procurement Specialist opening in Brisbane.\n\nOver the past 6 years, I have specialized in aerospace and industrial procurement, overseeing AED 12–15 million in capital and operational budgets at Gulf Aircraft & Engineering Services. My role entailed rigorous supplier negotiations, international OEM contracts, and managing time-sensitive AOG requisitions.\n\nMy background includes a BE in Electronics and OTAR Part 145/43 aerospace certification. I am prepared to relocate to Australia.\n\nPlease find my CV attached. I welcome the opportunity to discuss how my sourcing expertise matches Boeing's requirements.\n\nBest regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

class MemoryStore {
  private profile: UserProfile = { ...DEFAULT_USER_PROFILE };
  private settings: UserSettings = { ...DEFAULT_USER_SETTINGS };
  private leads: JobLead[] = [...SEED_LEADS];
  private logs: RunLog[] = [
    {
      id: "log_initial_seed",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      trigger: "manual",
      sourcesQueried: ["Adzuna", "Arbeitnow", "Jooble", "The Muse"],
      jobsFetched: 38,
      jobsQualified: 6,
      jobsSaved: 6,
      errors: [],
      status: "success",
    }
  ];
  private todaySends: number = 1;

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
    this.leads = JSON.parse(JSON.stringify(SEED_LEADS));
    this.profile = { ...DEFAULT_USER_PROFILE };
    this.settings = { ...DEFAULT_USER_SETTINGS };
    this.todaySends = 1;
  }
}

// Global singleton instance so state persists across API routes in memory
declare global {
  var __jobpilot_store__: MemoryStore | undefined;
}

export const memoryStore = global.__jobpilot_store__ || new MemoryStore();
if (process.env.NODE_ENV !== "production") {
  global.__jobpilot_store__ = memoryStore;
}
