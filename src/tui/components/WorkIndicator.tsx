import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

export interface WorkIndicatorProps {
  label?: string;
  activeTool?: string;
}

export const WorkIndicator: React.FC<WorkIndicatorProps> = ({
  label = 'Thinking...',
  activeTool,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" marginY={0}>
      <Box flexDirection="row" alignItems="center">
        <Text color="cyan" bold>
          {SPINNER_FRAMES[frameIndex]}{' '}
        </Text>
        <Text color="yellow" bold>
          {activeTool ? `Running tool: ${activeTool}...` : label}
        </Text>
      </Box>
    </Box>
  );
};
