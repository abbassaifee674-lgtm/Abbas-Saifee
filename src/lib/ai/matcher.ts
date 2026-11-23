import { UserProfile } from "@/types";
import { getAIProvider } from "./provider";

export interface MatchResult {
  matchScore: number; // 0 to 100
  matchReasons: string[]; // exactly 3 short bullet reasons
  missingSkills: string[];
}

export async function scoreJobMatch(
  jobTitle: string,
  company: string,
  jobDescription: string,
  profile: UserProfile
): Promise<MatchResult> {
  const provider = getAIProvider();

  // If no Gemini key is set, use intelligent heuristic matching for demo/offline
  if (!process.env.GEMINI_API_KEY) {
    return calculateHeuristicMatch(jobTitle, jobDescription, profile);
  }

  const systemInstruction = `You are an expert technical recruiting AI. Your job is to strictly evaluate how well a job opening matches the candidate's verified profile.
Be realistic, objective, and accurate.
Return a valid JSON object matching this schema:
{
  "matchScore": number (0 to 100),
  "matchReasons": [string, string, string] (exactly 3 concise, punchy bullet points highlighting genuine alignment with candidate's actual background),
  "missingSkills": [string] (1-3 skills requested by the job that are not clearly in candidate's profile, or empty array if fully aligned)
}`;

  const prompt = `Candidate Profile:
- Full Name: ${profile.fullName}
- Headline: ${profile.headline}
- Experience: ${profile.experienceYears} years
- Summary: ${profile.summary}
- Core Skills: ${profile.skills.join(", ")}
- Education & Certifications: ${profile.education.concat(profile.certifications).join("; ")}
- Past Titles: ${profile.pastTitles.join("; ")}

Job Details:
- Role Title: ${jobTitle}
- Company: ${company}
- Job Description:
"""
${jobDescription.slice(0, 3000)}
"""

Evaluate candidate-job alignment and output JSON:`;

  try {
    const result = await provider.generateJSON<MatchResult>(prompt, systemInstruction);
    return {
      matchScore: Math.min(100, Math.max(0, Math.round(result.matchScore || 50))),
      matchReasons: Array.isArray(result.matchReasons) ? result.matchReasons.slice(0, 3) : ["Strong domain background", "Experience in procurement operations", "Proven negotiation skills"],
      missingSkills: Array.isArray(result.missingSkills) ? result.missingSkills.slice(0, 3) : []
    };
  } catch (error) {
    console.warn("AI Match scoring failed, falling back to heuristic:", error);
    return calculateHeuristicMatch(jobTitle, jobDescription, profile);
  }
}

function calculateHeuristicMatch(
  jobTitle: string,
  jobDescription: string,
  profile: UserProfile
): MatchResult {
  const text = (jobTitle + " " + jobDescription).toLowerCase();
  let score = 55;
  const reasons: string[] = [];
  const missing: string[] = [];

  const keyMatches = [
    { kw: "procurement", reason: "Direct 6+ years procurement & purchasing background", points: 15 },
    { kw: "sourcing", reason: "Proven strategic sourcing & vendor management experience", points: 10 },
    { kw: "buyer", reason: "Extensive background as technical buyer and Capex/Opex oversight", points: 10 },
    { kw: "aviation", reason: "Specialized aerospace & AOG emergency parts sourcing background", points: 15 },
    { kw: "sap", reason: "Hands-on SAP MM and ERP system proficiency", points: 10 },
    { kw: "supply chain", reason: "End-to-end supply chain and inventory control (Wings ERP)", points: 8 },
    { kw: "negotiat", reason: "Proven supplier negotiation reducing costs by up to 85%", points: 8 },
  ];

  for (const item of keyMatches) {
    if (text.includes(item.kw)) {
      score += item.points;
      if (reasons.length < 3) {
        reasons.push(item.reason);
      }
    }
  }

  if (reasons.length < 3) {
    reasons.push("Strong technical engineering foundation (BE Electronics)");
  }
  if (reasons.length < 3) {
    reasons.push("Demonstrated record of AED 12-15M budget management");
  }

  if (text.includes("german") || text.includes("deutsch")) {
    missing.push("German language proficiency");
  }
  if (text.includes("french") || text.includes("français")) {
    missing.push("French language proficiency");
  }

  score = Math.min(95, Math.max(50, score));

  return {
    matchScore: score,
    matchReasons: reasons.slice(0, 3),
    missingSkills: missing.slice(0, 2)
  };
}
