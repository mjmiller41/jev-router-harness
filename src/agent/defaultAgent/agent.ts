import { defineAgent } from 'eve';

export const agentConfig = {
  name: 'jev-default-agent',
  description: 'Default agent configuration for Jev Router Harness',
  instructionsFile: './instructions.md',
  defaultTier: 'free' as const,
};

export const defaultEveAgent = defineAgent({
  model: 'gemini-2.5-flash',
  description: 'Default cost-optimized autonomous agent for Jev Router Harness',
});
