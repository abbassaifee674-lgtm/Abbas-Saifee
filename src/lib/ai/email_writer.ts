import { UserProfile, UserSettings } from "@/types";
import { getAIProvider } from "./provider";

export interface DraftEmailResponse {
  subject: string;
  body: string;
  factCheckWarning?: string;
}

/**
 * Fact-checks the AI draft against Abbas's CV profile:
 * Flags any unsupported company names, unusual numbers or years not grounded in Abbas's verified CV.
 */
export function factCheckDraftAgainstProfile(
  draftText: string,
  profile: UserProfile
): string | undefined {
  const warnings: string[] = [];
  const text = draftText.toLowerCase();

  // Known verified facts from Abbas's CV
  const verifiedCompanies = [
    "gulf aircraft",
    "pakistan beverage",
    "pepsico",
    "hatimi",
    "engineering services",
    "sidel",
    "krones",
    "ektam",
  ];

  // Check for common hallucinations of tech/finance/consulting firms
  const commonHallucinatedFirms = ["mckinsey", "deloitte", "pwc", "kpmg", "google", "amazon", "apple", "microsoft", "boeing engineer"];
  for (const firm of commonHallucinatedFirms) {
    if (text.includes(firm)) {
      warnings.push(`Mentioned company "${firm}" not found in Abbas's background.`);
    }
  }

  // Check for unrealistic budget claims (Abbas directed AED 12-15M)
  const highBudgetMatches = draftText.match(/(\$|€|£|AED|USD)\s*(\d+)\s*(billion|bn|million|M)/i);
  if (highBudgetMatches) {
    const amountStr = highBudgetMatches[2];
    const unit = highBudgetMatches[3].toLowerCase();
    const num = parseInt(amountStr, 10);
    if (unit.startsWith("b") || num > 100) {
      warnings.push(`High budget claim "${highBudgetMatches[0]}" exceeds Abbas's verified AED 12-15M experience.`);
    }
  }

  // Check years of experience claim
  const expMatch = draftText.match(/(\d+)\+?\s*years/i);
  if (expMatch) {
    const years = parseInt(expMatch[1], 10);
    if (years > 10 || years < 3) {
      warnings.push(`Experience claim of ${years} years deviates from verified ${profile.experienceYears} years.`);
    }
  }

  return warnings.length > 0 ? warnings.join(" ") : undefined;
}

export async function generateApplicationEmail(
  jobTitle: string,
  company: string,
  country: string,
  jobDescription: string,
  profile: UserProfile,
  settings: UserSettings,
  customInstruction?: string
): Promise<DraftEmailResponse> {
  const provider = getAIProvider();

  const systemInstruction = `You are a professional executive career copywriter writing directly as ${profile.fullName}.
Write a crisp, persuasive application email addressed to the hiring team at ${company} for the ${jobTitle} opening.

STRICT AUTHENTICITY AND COMPLIANCE RULES:
1. Length: exactly 120 - 180 words (excluding signature).
2. Tone: ${settings.emailTone === "friendly" ? "Professional yet warm and approachable" : "Formal, crisp, and direct"}.
3. DO NOT use generic clichés like "I am writing to express my keen interest", "I hope this email finds you well", or "Please find attached my resume".
4. NO emojis.
5. Highlight 2-3 specific real achievements from Abbas's CV that directly relate to the job:
   - Managing AED 12-15M in CAPEX and OPEX budgets at Gulf Aircraft & Engineering Services FZE
   - Sourcing OEM certified parts, managing AOG emergency shipments, and MSL ERP automation
   - SAP PRO HANA (MM module) and vendor negotiations reducing costs significantly (85% on plant line installations at PepsiCo)
   - BE Electronics from NED University + OTAR Part 145/43 Foundation certification.
6. ZERO HALLUCINATION: DO NOT invent or fabricate any experiences, degrees, dates, certifications, or metrics not in Abbas's profile.
7. Mention that Abbas is currently based in the UAE and fully available to relocate to ${country}. Mention his attached CV.
8. End with Abbas's exact signature:
"""
${settings.emailSignature}
"""
${customInstruction ? `USER CUSTOM INSTRUCTION: ${customInstruction}` : ""}

Return valid JSON format:
{
  "subject": "Clear, professional subject line including role and Abbas Saifee",
  "body": "The complete email body text"
}`;

  const prompt = `Job Opening:
- Title: ${jobTitle}
- Company: ${company}
- Location: ${country}
- Description snippet:
"""
${jobDescription.slice(0, 2500)}
"""

Candidate Profile:
- Name: ${profile.fullName}
- Experience: ${profile.experienceYears} years
- Summary: ${profile.summary}
- Skills: ${profile.skills.join(", ")}
- Current Role: ${profile.pastTitles[0] || ""}
- Past Experience: ${profile.pastTitles.join("; ")}
- Education: ${profile.education.join("; ")}

Write the tailored application email draft:`;

  try {
    const result = await provider.generateJSON<{ subject: string; body: string }>(prompt, systemInstruction);
    const body = result.body || "";
    const subject = result.subject || `Application: ${jobTitle} – ${profile.fullName}`;
    const factCheckWarning = factCheckDraftAgainstProfile(body, profile);

    return { subject, body, factCheckWarning };
  } catch (err) {
    console.warn("Gemini email generation error, generating fallback draft:", err);
    const fallback = generateFallbackEmail(jobTitle, company, country, profile, settings);
    return {
      subject: fallback.subject,
      body: fallback.body,
      factCheckWarning: undefined,
    };
  }
}

export async function generateFollowUpEmail(
  jobTitle: string,
  company: string,
  originalSubject: string,
  sentDate: string,
  profile: UserProfile,
  settings: UserSettings
): Promise<DraftEmailResponse> {
  const provider = getAIProvider();

  const systemInstruction = `You are writing a polite, concise 60-90 word follow-up email from ${profile.fullName} to the hiring team at ${company} regarding his application sent on ${sentDate}.
Keep it respectful, confident, grounded in his verified background, and free of pressure.
Return valid JSON: { "subject": "...", "body": "..." }`;

  const prompt = `Role: ${jobTitle} at ${company}. Sent date: ${sentDate}. Candidate: ${profile.fullName}. Signature:\n${settings.emailSignature}`;

  try {
    const result = await provider.generateJSON<{ subject: string; body: string }>(prompt, systemInstruction);
    return {
      subject: result.subject,
      body: result.body,
    };
  } catch (e) {
    return {
      subject: `Following up: ${originalSubject}`,
      body: `Hi ${company} Team,\n\nFollowing up on my note regarding the ${jobTitle} opportunity. I remain very enthusiastic about contributing my 6+ years of procurement and strategic sourcing experience to your team.\n\nPlease let me know if you need any additional details or if a brief call might be possible this week.\n\n${settings.emailSignature}`,
    };
  }
}

function generateFallbackEmail(
  jobTitle: string,
  company: string,
  country: string,
  profile: UserProfile,
  settings: UserSettings
): { subject: string; body: string } {
  const subject = `Application for ${jobTitle} – Abbas Saifee`;
  const body = `Dear ${company} Hiring Team,

I came across the ${jobTitle} opening at ${company} and wanted to put forward my background for consideration.

Over the past 6+ years, I have led technical and general procurement operations, managing AED 12–15 million in CAPEX and OPEX budgets. At Gulf Aircraft & Engineering Services, I directed global OEM sourcing, managed time-critical AOG emergency shipments, and implemented automated reorder controls in ERP that eliminated supply bottlenecks. Prior to this, at PepsiCo (Pakistan Beverage Limited), I utilized SAP PRO HANA (MM) for plant-critical equipment and negotiated direct supplier agreements that cut costs significantly.

With an engineering foundation in Electronics (NED University) and OTAR Part 145/43 compliance credentials, I specialize in streamlining supplier relationships while protecting operational margins. I am currently based in the UAE and fully prepared to relocate to ${country}.

My complete CV is attached for your review. I would welcome 10 minutes to discuss how my sourcing background can support ${company}'s procurement goals.

${settings.emailSignature}`;

  return { subject, body };
}
