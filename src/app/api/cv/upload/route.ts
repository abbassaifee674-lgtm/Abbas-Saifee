import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { extractTextFromPDF, parseCVTextToProfile } from "@/lib/ai/cv_parser";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const authRes = await verifyAbbasAuth(req);
  if (authRes instanceof NextResponse) return authRes;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Save uploaded file to assets/ folder
    const assetsDir = path.join(process.cwd(), "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const savePath = path.join(assetsDir, safeName);
    fs.writeFileSync(savePath, buffer);

    // 2. Extract text from PDF
    const text = await extractTextFromPDF(buffer);

    // 3. Parse text using Gemini AI into structured profile
    let structuredProfile = {};
    try {
      structuredProfile = await parseCVTextToProfile(text);
    } catch (aiErr) {
      console.warn("CV AI parsing error, keeping existing fields:", aiErr);
    }

    // 4. Update profile in store
    const updated = memoryStore.updateProfile({
      ...structuredProfile,
      cvFileName: safeName,
      cvUploadedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "CV uploaded and profile updated successfully",
      profile: updated,
      fileName: safeName,
      extractedChars: text.length,
    });
  } catch (err: any) {
    console.error("CV upload processing failed:", err);
    return NextResponse.json({ error: err.message || "Failed to process CV upload" }, { status: 500 });
  }
}
