import { describe, it, expect } from 'vitest';
import { parseCliFlags } from '../../src/cli/flags.js';

describe('CLI Arguments and Flags Contract', () => {
  it('parses defaults when no flags supplied', () => {
    const parsed = parseCliFlags([]);
    expect(parsed.model).toBe('auto');
    expect(parsed.tier).toBe('auto');
    expect(parsed.dryRun).toBe(false);
    expect(parsed.initialPrompt).toBeUndefined();
  });

  it('parses model and tier override flags', () => {
    const parsed = parseCliFlags(['--model', 'claude-3-5-sonnet', '--tier', 'premium', '--dry-run']);
    expect(parsed.model).toBe('claude-3-5-sonnet');
    expect(parsed.tier).toBe('premium');
    expect(parsed.dryRun).toBe(true);
  });

  it('parses short flags', () => {
    const parsed = parseCliFlags(['-m', 'gpt-4o-mini', '-t', 'budget']);
    expect(parsed.model).toBe('gpt-4o-mini');
    expect(parsed.tier).toBe('budget');
  });

  it('extracts trailing initial prompt argument', () => {
    const parsed = parseCliFlags(['-m', 'gemini-2.5-flash', 'How', 'are', 'you?']);
    expect(parsed.model).toBe('gemini-2.5-flash');
    expect(parsed.initialPrompt).toBe('How are you?');
  });

  it('validates invalid tier value', () => {
    expect(() => parseCliFlags(['--tier', 'invalid-tier'])).toThrow(/Invalid tier/);
  });
});
