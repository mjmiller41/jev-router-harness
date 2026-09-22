import { describe, it, expect } from 'vitest';
import { estimateTokenCount, estimateContextHeadroom } from '../../src/memory/tokenCounter.js';

describe('Token Counter', () => {
  it('estimates token count from text accurately', () => {
    const text = 'Hello world! This is a token counting test for AI models.';
    const tokens = estimateTokenCount(text);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(25);
  });

  it('handles empty and whitespace strings', () => {
    expect(estimateTokenCount('')).toBe(0);
    expect(estimateTokenCount('   \n\t  ')).toBe(0);
  });

  it('calculates headroom and utilization ratio', () => {
    const headroom = estimateContextHeadroom(15000, 20000);
    expect(headroom.remainingTokens).toBe(5000);
    expect(headroom.utilizationRatio).toBe(0.75);
    expect(headroom.isThresholdExceeded).toBe(true);
  });

  it('flags threshold not exceeded when below 75%', () => {
    const headroom = estimateContextHeadroom(10000, 20000);
    expect(headroom.utilizationRatio).toBe(0.5);
    expect(headroom.isThresholdExceeded).toBe(false);
  });
});
