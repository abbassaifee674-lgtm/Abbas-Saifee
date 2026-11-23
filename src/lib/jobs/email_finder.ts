import { ContactStatus } from "@/types";

export interface ContactDiscoveryResult {
  email?: string;
  contactStatus: ContactStatus;
  sourceDetails?: string;
}

// Regex to extract emails from raw HTML or text
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Priority prefixes for recruiting
const RECRUITING_PREFIXES = ["careers", "recruitment", "jobs", "hr", "talent", "apply", "sourcing"];

export async function findCompanyContact(
  company: string,
  applyUrl: string,
  rawDescription: string
): Promise<ContactDiscoveryResult> {
  // 1. Check if email is explicitly mentioned in the job description or apply URL
  const descEmails = rawDescription.match(EMAIL_REGEX) || [];
  const validDescEmail = filterLegitEmail(descEmails);
  if (validDescEmail) {
    return {
      email: validDescEmail,
      contactStatus: "Email found",
      sourceDetails: "Directly specified in job description",
    };
  }

  // 2. Extract company domain from apply URL if possible
  let domain: string | null = null;
  try {
    const parsed = new URL(applyUrl);
    // Ignore job aggregators like adzuna, linkedin, indeed, jooble, etc.
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const aggregators = ["adzuna", "jooble", "remotive", "arbeitnow", "themuse", "indeed", "linkedin", "glassdoor", "stepstone"];
    const isAggregator = aggregators.some((agg) => hostname.includes(agg));

    if (!isAggregator && hostname.includes(".")) {
      domain = hostname;
    }
  } catch {}

  // 3. If domain is not from applyUrl, try clean company name domain
  if (!domain && company) {
    const cleanName = company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanName.length > 2) {
      domain = `${cleanName}.com`;
    }
  }

  // 4. Try Hunter.io API if configured
  if (process.env.HUNTER_API_KEY && domain) {
    try {
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=5`;
      const res = await fetch(hunterUrl);
      if (res.ok) {
        const data = await res.json();
        const emails = data.data?.emails || [];
        // Look for HR/Recruiting specific email
        const hrEmail = emails.find((e: any) =>
          RECRUITING_PREFIXES.some((prefix) => e.value?.toLowerCase().startsWith(prefix))
        );
        if (hrEmail) {
          return {
            email: hrEmail.value,
            contactStatus: "Email found",
            sourceDetails: "Verified via Hunter.io",
          };
        }
        if (emails.length > 0 && emails[0].value) {
          return {
            email: emails[0].value,
            contactStatus: "Email guessed (verify)",
            sourceDetails: "Hunter.io domain match",
          };
        }
      }
    } catch (e) {
      console.warn("Hunter.io lookup error:", e);
    }
  }

  // 5. Check company website contact/careers page if domain is known
  if (domain) {
    const pageCandidates = [
      `https://${domain}/careers`,
      `https://${domain}/contact`,
      `https://${domain}/about`
    ];

    for (const testUrl of pageCandidates) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(testUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JobPilot/1.0",
          },
        });
        clearTimeout(timeout);

        if (res.ok) {
          const html = await res.text();
          const pageEmails = html.match(EMAIL_REGEX) || [];
          const candidate = filterLegitEmail(pageEmails);
          if (candidate) {
            return {
              email: candidate,
              contactStatus: candidate.includes("career") || candidate.includes("hr") || candidate.includes("recruitment")
                ? "Email found"
                : "Email guessed (verify)",
              sourceDetails: `Found on ${testUrl}`,
            };
          }
        }
      } catch {
        // Ignore timeout or network errors
      }
    }
  }

  // 6. Predict HR/Careers email based on domain
  if (domain && !domain.includes("adzuna") && !domain.includes("jooble")) {
    return {
      email: `careers@${domain}`,
      contactStatus: "Email guessed (verify)",
      sourceDetails: `Domain-based talent inbox prediction (${domain})`,
    };
  }

  // 7. Fallback: Apply via link only
  return {
    email: undefined,
    contactStatus: "Apply via link only",
    sourceDetails: "Direct application link provided",
  };
}

function filterLegitEmail(emails: string[]): string | undefined {
  const invalidSubstrings = [
    "example.com",
    "domain.com",
    "yourdomain",
    "support@",
    "abuse@",
    "noreply",
    "no-reply",
    "donotreply",
    "privacy@",
    ".png",
    ".jpg",
    "sentry.io",
    "cloudflare",
  ];

  for (const raw of emails) {
    const email = raw.toLowerCase().trim();
    if (invalidSubstrings.some((bad) => email.includes(bad))) continue;

    // Check if ends with valid TLD
    if (/\.[a-z]{2,8}$/.test(email)) {
      return email;
    }
  }
  return undefined;
}
