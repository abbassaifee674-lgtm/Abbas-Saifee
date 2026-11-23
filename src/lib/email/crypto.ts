import crypto from "crypto";
import { getResolvedEncryptionKey } from "../env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = getResolvedEncryptionKey();
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt sensitive token string before saving to database
 */
export function encryptToken(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive token string retrieved from database
 */
export function decryptToken(encryptedString: string): string {
  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) {
      return encryptedString;
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("Token decryption failed:", err);
    throw new Error("Failed to decrypt secure token.");
  }
}
