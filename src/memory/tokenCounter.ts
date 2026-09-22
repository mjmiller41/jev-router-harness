export interface HeadroomStatus {
  maxTokens: number;
  currentTokens: number;
  remainingTokens: number;
  utilizationRatio: number;
  isThresholdExceeded: boolean;
}

/**
 * Estimates token count from text using standard word/punctuation heuristics (avg 4 chars/token).
 */
export function estimateTokenCount(text: string): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  // Rough rule of thumb: ~4 characters per token in English / code
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const charEstimate = Math.ceil(trimmed.length / 4);
  return Math.max(wordCount, charEstimate);
}

export function estimateContextHeadroom(
  currentTokens: number,
  maxTokens: number,
  thresholdRatio = 0.75
): HeadroomStatus {
  const remaining = Math.max(0, maxTokens - currentTokens);
  const ratio = maxTokens > 0 ? Math.min(1.0, currentTokens / maxTokens) : 1.0;

  return {
    maxTokens,
    currentTokens,
    remainingTokens: remaining,
    utilizationRatio: ratio,
    isThresholdExceeded: ratio >= thresholdRatio,
  };
}
