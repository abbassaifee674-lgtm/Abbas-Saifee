import { UserProfile, UserSettings } from "@/types";
import { getAIProvider } from "./provider";

export interface DraftEmailResponse {
  subject: string;
  body: string;
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

  // If no Gemini key is set, generate a clean high-converting template
  if (!process.env.GEMINI_API_KEY) {
    return generateFallbackEmail(jobTitle, company, country, profile, settings);
  }

  const systemInstruction = `You are a high-level executive career advisor and email copywriter writing directly as ${profile.fullName}.
Write a crisp, persuasive application email addressed to the hiring team at ${company} for the ${jobTitle} opening.

STRICT CONSTRAINTS:
1. Length: 120 - 180 words (excluding signature).
2. Tone: ${settings.emailTone === "friendly" ? "Professional yet warm and approachable" : "Formal, crisp, and direct"}.
3. DO NOT use generic clichés like "I am writing to express my keen interest", "I hope this email finds you well", or "Please find attached my resume".
4. NO emojis.
5. Highlight 2-3 specific real achievements from Abbas's CV that directly relate to the job (e.g., directing AED 12-15M in Capex/Opex, managing OEM and AOG emergency procurement at Gulf Aircraft & Engineering Services, SAP MM expertise, reducing installation costs by 85% at PepsiCo).
6. DO NOT invent or fabricate any experiences, degrees, dates, or metrics not in Abbas's profile.
7. Note that Abbas is currently based in the UAE and fully available to relocate to ${country}. Mention his attached CV.
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
- Education: ${profile.education.join("; ")}

Write the tailored application email draft:`;

  try {
    const result = await provider.generateJSON<DraftEmailResponse>(prompt, systemInstruction);
    return {
      subject: result.subject || `Application: ${jobTitle} - ${profile.fullName}`,
      body: result.body || generateFallbackEmail(jobTitle, company, country, profile, settings).body,
    };
  } catch (err) {
    console.warn("Failed to generate AI email via Gemini, using fallback:", err);
    return generateFallbackEmail(jobTitle, company, country, profile, settings);
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

  if (!process.env.GEMINI_API_KEY) {
    return {
      subject: `Following up: ${originalSubject.replace(/^Re:\s*/i, "")}`,
      body: `Hi ${company} Hiring Team,\n\nI wanted to briefly follow up on my application sent on ${sentDate} regarding the ${jobTitle} position.\n\nWith my 6+ years of technical procurement background managing AED 12-15M in budgets and SAP MM operations, I am confident I can bring immediate value to ${company}'s supply chain operations.\n\nI would welcome the opportunity to discuss how my sourcing expertise aligns with your team's goals. I have attached my CV once again for your convenience.\n\n${settings.emailSignature}`
    };
  }

  const systemInstruction = `You are writing a polite, concise 60-90 word follow-up email from ${profile.fullName} to the hiring team at ${company} regarding his application sent on ${sentDate}.
Keep it respectful, confident, and free of pressure.
Return valid JSON: { "subject": "...", "body": "..." }`;

  const prompt = `Role: ${jobTitle} at ${company}. Sent date: ${sentDate}. Candidate: ${profile.fullName}. Signature:\n${settings.emailSignature}`;

  try {
    return await provider.generateJSON<DraftEmailResponse>(prompt, systemInstruction);
  } catch (e) {
    return {
      subject: `Following up: ${originalSubject}`,
      body: `Hi ${company} Team,\n\nFollowing up on my note regarding the ${jobTitle} opportunity. I remain very enthusiastic about contributing my 6+ years of procurement and strategic sourcing experience to your team.\n\nPlease let me know if you need any additional details or if a brief call might be possible this week.\n\n${settings.emailSignature}`
    };
  }
}

function generateFallbackEmail(
  jobTitle: string,
  company: string,
  country: string,
  profile: UserProfile,
  settings: UserSettings
): DraftEmailResponse {
  const subject = `Application for ${jobTitle} – Abbas Saifee`;
  const body = `Dear ${company} Hiring Team,

I came across the ${jobTitle} opening at ${company} and wanted to put forward my background for consideration.

Over the past 6+ years, I have led technical and general procurement operations, managing AED 12–15 million in CAPEX and OPEX budgets. At Gulf Aircraft & Engineering Services, I directed global OEM sourcing, managed time-critical AOG emergency shipments, and implemented automated reorder controls in ERP that eliminated supply bottlenecks. Prior to this, at PepsiCo (Pakistan Beverage Limited), I utilized SAP PRO HANA (MM) for plant-critical equipment and negotiated direct supplier agreements that cut costs significantly.

With an engineering foundation in Electronics (NED University) and OTAR Part 145/43 compliance credentials, I specialize in streamlining supplier relationships while protecting operational margins. I am currently based in the UAE and fully prepared to relocate to ${country}.

My complete CV is attached for your review. I would welcome 10 minutes to discuss how my sourcing background can support ${company}'s procurement goals.

${settings.emailSignature}`;

  return { subject, body };
}
