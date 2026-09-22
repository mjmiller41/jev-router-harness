import React from 'react';
import { Box, Text } from 'ink';

export interface StatusBarProps {
  model?: string;
  tier?: string;
  sessionCost?: number;
  totalTokens?: number;
  contextUsageRatio?: number;
  statusText?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  model = 'auto',
  tier = 'free',
  sessionCost = 0.0,
  totalTokens = 0,
  contextUsageRatio = 0.0,
  statusText = 'Ready',
}) => {
  const tierColor = tier === 'free' ? 'green' : tier === 'budget' ? 'yellow' : 'magenta';
  const usagePercent = Math.round(contextUsageRatio * 100);

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box flexDirection="row">
        <Text bold>Model: </Text>
        <Text color="cyan">{model} </Text>
        <Text bold>Tier: </Text>
        <Text color={tierColor}>[{tier}] </Text>
        <Text bold>Status: </Text>
        <Text color="white">{statusText}</Text>
      </Box>

      <Box flexDirection="row">
        <Text bold>Context: </Text>
        <Text color={usagePercent > 70 ? 'yellow' : 'gray'}>{usagePercent}% </Text>
        <Text bold>Tokens: </Text>
        <Text color="gray">{totalTokens.toLocaleString()} </Text>
        <Text bold>Cost: </Text>
        <Text color="green">${sessionCost.toFixed(4)}</Text>
      </Box>
    </Box>
  );
};
