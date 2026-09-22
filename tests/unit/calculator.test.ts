import { describe, it, expect } from 'vitest';
import { execute, name, description } from '../../src/agent/defaultAgent/tools/calculator.js';

describe('Calculator Tool', () => {
  it('has valid metadata', () => {
    expect(name).toBe('calculator');
    expect(description).toBeDefined();
  });

  it('evaluates arithmetic expressions safely', async () => {
    const res = await execute({ expression: '12 + 8 * 2' });
    expect(res.result).toBe(28);
  });
});
