import React from 'react';
import { Box, Text } from 'ink';
import { SessionMetrics, CostSavings } from '../../telemetry/costCalculator.js';

export interface TelemetryViewProps {
  metrics: SessionMetrics;
  savings: CostSavings;
  isOpen: boolean;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ metrics, savings, isOpen }) => {
  if (!isOpen) return null;

  return (
    <Box
      borderStyle="double"
      borderColor="magenta"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginY={1}
    >
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="magenta">
          📊 Session Telemetry & Cost Dashboard
        </Text>
      </Box>

      <Box flexDirection="column" paddingLeft={1}>
        <Box flexDirection="row">
          <Text bold>Total Conversation Turns: </Text>
          <Text color="cyan">{metrics.totalTurns}</Text>
        </Box>
        <Box flexDirection="row">
          <Text bold>Model Tier Breakdown: </Text>
          <Text color="green">Free: {metrics.freeTurns} </Text>
          <Text color="yellow">Budget: {metrics.budgetTurns} </Text>
          <Text color="magenta">Premium: {metrics.premiumTurns}</Text>
        </Box>
        <Box flexDirection="row">
          <Text bold>Tokens Processed: </Text>
          <Text>
            Input: {metrics.totalInputTokens.toLocaleString()} | Output:{' '}
            {metrics.totalOutputTokens.toLocaleString()}
          </Text>
        </Box>
        <Box flexDirection="row">
          <Text bold>Average Turn Latency: </Text>
          <Text>{metrics.averageLatencyMs}ms</Text>
        </Box>

        <Box
          marginTop={1}
          flexDirection="column"
          borderStyle="single"
          borderColor="gray"
          paddingX={1}
        >
          <Box flexDirection="row">
            <Text bold color="green">
              Actual Incurred Cost:{' '}
            </Text>
            <Text bold color="green">
              ${savings.totalCostUsd.toFixed(4)} USD
            </Text>
          </Box>
          <Box flexDirection="row">
            <Text color="gray">Cost If All Routed to Premium: </Text>
            <Text color="gray">${savings.costIfAllPremiumUsd.toFixed(4)} USD</Text>
          </Box>
          <Box flexDirection="row">
            <Text bold color="yellow">
              Total Saved by Jev Dynamic Router:{' '}
            </Text>
            <Text bold color="yellow">
              ${savings.dollarsSavedUsd.toFixed(4)} USD ({savings.percentageSaved}% saved)
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
