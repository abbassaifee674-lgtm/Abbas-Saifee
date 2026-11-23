import { UserProfile } from "@/types";
import { getAIProvider } from "./provider";
import pdf from "pdf-parse";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text || "";
}

export async function parseCVTextToProfile(cvText: string): Promise<Partial<UserProfile>> {
  const provider = getAIProvider();

  if (!process.env.GEMINI_API_KEY) {
    return {
      experienceYears: 6,
      skills: [
        "Procurement",
        "Strategic Sourcing",
        "SAP MM",
        "Vendor Management",
        "Budget Optimization",
        "Contract Negotiation"
      ],
      pastTitles: [
        "Officer III General Procurement",
        "E & I Engineer & Technical Procurement"
      ],
      education: [
        "BE Electronics - NED University of Engineering and Technology"
      ],
      languages: ["English", "Urdu"],
      certifications: ["OTAR Part 145 & Part 43 Foundation"]
    };
  }

  const systemInstruction = `You are an expert HR parser. Given the raw extracted text of a CV, extract accurate, structured profile data.
Output strictly JSON matching this structure:
{
  "fullName": string,
  "headline": string,
  "experienceYears": number,
  "summary": string,
  "skills": [string],
  "pastTitles": [string],
  "education": [string],
  "languages": [string],
  "certifications": [string],
  "phone": string,
  "location": string,
  "linkedin": string
}`;

  const prompt = `Extract structured profile details from this CV text:\n"""\n${cvText.slice(0, 7000)}\n"""`;

  try {
    const profile = await provider.generateJSON<Partial<UserProfile>>(prompt, systemInstruction);
    return profile;
  } catch (err) {
    console.error("Failed to parse CV with Gemini:", err);
    throw err;
  }
}
