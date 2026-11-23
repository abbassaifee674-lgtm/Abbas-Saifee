import { adminDb } from "./admin";
import { UserProfile } from "@/types";

export const MAX_SINGLE_DOC_SIZE_BYTES = 700 * 1024; // 700 KB recommended limit
export const CHUNK_SIZE_BYTES = 450 * 1024; // ~450 KB chunk size (well under Firestore 1 MiB doc limit)

export interface StoredCV {
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  extractedText?: string;
  profile?: Partial<UserProfile>;
  isChunked: boolean;
  totalChunks?: number;
  base64Data?: string; // present if not chunked
}

/**
 * Saves CV PDF data directly into Firestore (no Firebase Storage needed)
 * If under 700 KB: saved directly in users/{uid}/cv/main
 * If over 700 KB: chunked across users/{uid}/cv/main and users/{uid}/cv_chunks/{index}
 */
export async function saveCVToFirestore(
  uid: string,
  fileName: string,
  buffer: Buffer,
  extractedText?: string,
  profile?: Partial<UserProfile>
): Promise<{ success: boolean; isChunked: boolean; totalChunks: number; warning?: string }> {
  const base64String = buffer.toString("base64");
  const fileSizeBytes = buffer.length;
  const isChunked = fileSizeBytes > MAX_SINGLE_DOC_SIZE_BYTES;

  let warning: string | undefined;
  if (isChunked) {
    warning = `PDF file size is ${(fileSizeBytes / 1024).toFixed(1)} KB (exceeds 700 KB). Split into chunks across Firestore documents to respect free Spark tier limits.`;
  }

  const cvRef = adminDb.collection("users").doc(uid).collection("cv").doc("main");

  if (!isChunked) {
    // Single document storage
    await cvRef.set({
      fileName,
      fileSizeBytes,
      uploadedAt: new Date().toISOString(),
      extractedText: extractedText || "",
      profile: profile || {},
      isChunked: false,
      totalChunks: 1,
      base64Data: base64String,
    });

    return { success: true, isChunked: false, totalChunks: 1 };
  }

  // Chunked storage
  // Each chunk string length in base64: ~600,000 characters
  const chunkCharSize = Math.floor((CHUNK_SIZE_BYTES * 4) / 3);
  const totalChunks = Math.ceil(base64String.length / chunkCharSize);

  const batch = adminDb.batch();

  // Save metadata in main document
  batch.set(cvRef, {
    fileName,
    fileSizeBytes,
    uploadedAt: new Date().toISOString(),
    extractedText: extractedText || "",
    profile: profile || {},
    isChunked: true,
    totalChunks,
    base64Data: null, // content is in chunks collection
  });

  // Save chunks in subcollection cv_chunks
  const chunksCollection = adminDb.collection("users").doc(uid).collection("cv_chunks");

  for (let i = 0; i < totalChunks; i++) {
    const chunkData = base64String.substring(i * chunkCharSize, (i + 1) * chunkCharSize);
    const chunkDocRef = chunksCollection.doc(`chunk_${i}`);
    batch.set(chunkDocRef, {
      chunkIndex: i,
      chunkData,
      uploadedAt: new Date().toISOString(),
    });
  }

  await batch.commit();

  return { success: true, isChunked: true, totalChunks, warning };
}

/**
 * Retrieves the CV PDF Buffer and metadata from Firestore
 */
export async function getCVFromFirestore(uid: string): Promise<{
  fileName: string;
  buffer: Buffer;
  extractedText?: string;
} | null> {
  try {
    const cvRef = adminDb.collection("users").doc(uid).collection("cv").doc("main");
    const docSnap = await cvRef.get();

    if (!docSnap.exists) {
      return null;
    }

    const data = docSnap.data() as StoredCV;
    const fileName = data.fileName || "Abbas_Saifee_Procurement_CV.pdf";

    if (!data.isChunked && data.base64Data) {
      return {
        fileName,
        buffer: Buffer.from(data.base64Data, "base64"),
        extractedText: data.extractedText,
      };
    }

    // Reassemble chunks
    if (data.isChunked && data.totalChunks) {
      const chunksCollection = adminDb.collection("users").doc(uid).collection("cv_chunks");
      const chunksSnap = await chunksCollection.orderBy("chunkIndex", "asc").get();

      let fullBase64 = "";
      chunksSnap.forEach((chunkDoc) => {
        const chunkData = chunkDoc.data()?.chunkData || "";
        fullBase64 += chunkData;
      });

      return {
        fileName,
        buffer: Buffer.from(fullBase64, "base64"),
        extractedText: data.extractedText,
      };
    }

    return null;
  } catch (err) {
    console.warn("Could not retrieve CV from Firestore:", err);
    return null;
  }
}
