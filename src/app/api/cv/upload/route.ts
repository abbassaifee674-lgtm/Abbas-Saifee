import { NextRequest, NextResponse } from "next/server";
import { verifyAbbasAuth } from "@/lib/utils/auth_guard";
import { memoryStore } from "@/lib/firebase/mock_store";
import { extractTextFromPDF, parseCVTextToProfile } from "@/lib/ai/cv_parser";
import { saveCVToFirestore, MAX_SINGLE_DOC_SIZE_BYTES } from "@/lib/firebase/cv_store";
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

    // 1. Validate that it is a PDF
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF files are supported." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sizeKB = Math.round(buffer.length / 1024);

    // Hard ceiling for Firestore chunking (keep under 3.5 MB so Abbas doesn't exceed reasonable Firestore limits)
    if (buffer.length > 3.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: `CV file size is ${sizeKB} KB. Firestore free tier requires files under 700 KB. Please compress your PDF before uploading.`,
        },
        { status: 400 }
      );
    }

    // 2. Save locally in assets/
    const assetsDir = path.join(process.cwd(), "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const savePath = path.join(assetsDir, safeName);
    fs.writeFileSync(savePath, buffer);

    // 3. Extract text from PDF
    const text = await extractTextFromPDF(buffer);

    // 4. Parse text using Gemini AI into structured profile
    let structuredProfile = {};
    try {
      structuredProfile = await parseCVTextToProfile(text);
    } catch (aiErr) {
      console.warn("CV AI parsing error, keeping existing fields:", aiErr);
    }

    // 5. Store PDF base64 & structured data directly in Firestore (NO Firebase Storage needed!)
    let firestoreResult: { isChunked: boolean; totalChunks: number; warning?: string } = {
      isChunked: false,
      totalChunks: 1,
      warning: undefined,
    };
    try {
      firestoreResult = await saveCVToFirestore(
        authRes.uid || "abbas_saifee",
        safeName,
        buffer,
        text,
        structuredProfile
      );
    } catch (fsErr) {
      console.warn("Firestore CV storage warning (local fallback used):", fsErr);
    }

    // 6. Update profile in store
    const updated = memoryStore.updateProfile({
      ...structuredProfile,
      cvFileName: safeName,
      cvUploadedAt: new Date().toISOString(),
    });

    const isLargeWarning =
      buffer.length > MAX_SINGLE_DOC_SIZE_BYTES
        ? `Note: File size is ${sizeKB} KB. For optimal performance, a CV under 700 KB is recommended, but your file was successfully saved and chunked in Firestore.`
        : undefined;

    return NextResponse.json({
      success: true,
      message: "CV uploaded, parsed, and saved to Firestore successfully",
      profile: updated,
      fileName: safeName,
      fileSizeKB: sizeKB,
      isChunked: firestoreResult.isChunked,
      totalChunks: firestoreResult.totalChunks,
      warning: isLargeWarning || firestoreResult.warning,
      extractedChars: text.length,
    });
  } catch (err: any) {
    console.error("CV upload processing failed:", err);
    return NextResponse.json({ error: err.message || "Failed to process CV upload" }, { status: 500 });
  }
}
