import { UserProfile, UserSettings } from "@/types";

export const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL || process.env.NEXT_PUBLIC_ALLOWED_EMAIL || "abbassaifee674@gmail.com";

export const INITIAL_COUNTRIES = [
  "Luxembourg",
  "Austria",
  "Singapore",
  "Germany",
  "Australia",
  "Malaysia",
  "Norway",
  "Denmark",
  "New Zealand",
  "South Africa",
  "France",
  "Italy",
];

export const INITIAL_JOB_TITLES = [
  "Procurement Specialist",
  "Strategic Sourcing Specialist",
  "Technical Buyer",
  "Purchasing Officer",
  "Supply Chain Specialist",
  "Sourcing Manager",
  "Materials Buyer",
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  fullName: "Abbas Saifee",
  email: "abbassaifee674@gmail.com",
  phone: "+971 564541753",
  location: "Sharjah, United Arab Emirates (Open to Relocation)",
  linkedin: "https://linkedin.com/in/abbas-saifee-75a52213a/",
  headline: "Procurement Specialist | 6+ Yrs Aviation, Technical & General Procurement | SAP MM & Budget Optimization",
  experienceYears: 6,
  summary:
    "Motivated and dedicated procurement specialist with 6+ years of experience in strategic sourcing, supply chain management, vendor negotiations, and CAPEX/OPEX budget optimization (AED 12-15M). Strong engineering foundation with expertise in SAP PRO HANA (MM module), Wings ERP, AOG emergency procurement, and international OEM vendor relationships.",
  skills: [
    "Strategic Sourcing & Procurement",
    "CAPEX & OPEX Budget Management (AED 12-15M)",
    "Supplier & Vendor Negotiations",
    "SAP PRO HANA (MM Module)",
    "Wings ERP & MSL Inventory Control",
    "Aviation & Technical Spare Parts Purchasing",
    "Contract & Tender Management",
    "Cost Reduction & Value Engineering",
    "AOG (Aircraft On Ground) Emergency Purchases",
    "International Freight & Customs Compliance"
  ],
  pastTitles: [
    "Officer III General Procurement (Gulf Aircraft & Engineering Services FZE)",
    "E & I Engineer & Technical Procurement (Pakistan Beverage Limited - PepsiCo)",
    "Site Electrical Engineer & Procurement (Hatimi Building Maintenance Co.)"
  ],
  education: [
    "BE Electronics - NED University of Engineering and Technology (2019)",
    "OTAR Part 145 & Part 43 Foundation - SOFEMA Aviation (2023)",
    "Industrial Automation & PLC - Usman Institute of Technology (2019)"
  ],
  languages: ["English (Fluent / Professional)", "Urdu (Native)", "Arabic (Basic)"],
  certifications: [
    "OTAR Part 145 & Part 43 Foundation - SOFEMA Aviation",
    "Director General's Certificate of Recognition for High-Impact Cost Savings",
    "Industrial Automation & PLC Certification"
  ],
  cvFileName: "Abbas_Saifee_Procurement_CV.pdf"
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  allowedEmail: ALLOWED_EMAIL,
  targetCountries: INITIAL_COUNTRIES,
  targetJobTitles: INITIAL_JOB_TITLES,
  jobTypeFilters: {
    fullTime: true,
    remote: false,
    contract: false,
    visaSponsorshipPreferred: true,
  },
  minMatchScore: 60,
  maxEmailsPerDay: 20, // default 20, hard cap 40
  emailTone: "formal",
  emailSignature: `Best regards,\n\nAbbas Saifee\nProcurement Specialist\nPhone: +971 564541753\nLinkedIn: https://linkedin.com/in/abbas-saifee-75a52213a/\nSharjah, UAE (Available for Relocation)`,
  phone: "+971 564541753",
  linkedin: "https://linkedin.com/in/abbas-saifee-75a52213a/",
  gmailConnected: false,
  gmailConnectedEmail: ALLOWED_EMAIL,
};
