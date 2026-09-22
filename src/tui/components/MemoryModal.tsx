import React from 'react';
import { Box, Text } from 'ink';
import { MemoryItem } from '../../types/index.js';

export interface MemoryModalProps {
  memories: MemoryItem[];
  isOpen: boolean;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({ memories, isOpen }) => {
  if (!isOpen) return null;

  return (
    <Box
      borderStyle="double"
      borderColor="green"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginY={1}
    >
      <Box flexDirection="row" marginBottom={1}>
        <Text bold color="green">
          🧠 Persistent Memory Store ({memories.length} items)
        </Text>
      </Box>

      {memories.length === 0 ? (
        <Text color="gray">
          No persistent memories saved yet. Use /memory add &lt;key&gt; &lt;content&gt;
        </Text>
      ) : (
        memories.map((m) => (
          <Box key={m.id} flexDirection="column" marginBottom={1}>
            <Box flexDirection="row">
              <Text bold color="yellow">
                [{m.category}] {m.key}:
              </Text>
              <Text color="gray"> (accessed {m.accessCount}x)</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text>{m.content}</Text>
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
};
