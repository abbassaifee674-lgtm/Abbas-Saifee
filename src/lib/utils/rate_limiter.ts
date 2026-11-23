import { DailySendQuota } from "@/types";
import { memoryStore } from "../firebase/mock_store";

export const HARD_CAP_DAILY_EMAILS = 40;

/**
 * Rate limiter and quota checker to protect Abbas's personal Gmail account
 */
export async function checkDailySendQuota(requestedCount = 1): Promise<{
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  reason?: string;
}> {
  const settings = memoryStore.getSettings();
  const configuredMax = settings.maxEmailsPerDay || 20;
  // Never exceed hard cap of 40
  const effectiveLimit = Math.min(configuredMax, HARD_CAP_DAILY_EMAILS);

  const currentCount = memoryStore.getDailySends();
  const remaining = Math.max(0, effectiveLimit - currentCount);

  if (currentCount + requestedCount > effectiveLimit) {
    return {
      allowed: false,
      currentCount,
      limit: effectiveLimit,
      remaining,
      reason: `Daily send limit reached (${currentCount}/${effectiveLimit}). Hard cap is set to protect your Gmail reputation. Try again tomorrow or raise daily limit in Settings (max 40).`,
    };
  }

  return {
    allowed: true,
    currentCount,
    limit: effectiveLimit,
    remaining: remaining - requestedCount,
  };
}

export function recordSentEmail(): number {
  return memoryStore.incrementDailySends();
}
