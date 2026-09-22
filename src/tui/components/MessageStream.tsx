import React from 'react';
import { Box, Text } from 'ink';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tier?: string;
}

export interface MessageStreamProps {
  messages: DisplayMessage[];
  streamingContent?: string;
  activeModel?: string;
  isStreaming?: boolean;
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  messages,
  streamingContent = '',
  activeModel,
  isStreaming = false,
}) => {
  return (
    <Box flexDirection="column" marginY={1}>
      {messages.map((msg) => (
        <Box key={msg.id} flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            <Text bold color={msg.role === 'user' ? 'green' : 'blue'}>
              {msg.role === 'user' ? '👤 User' : `🤖 Assistant (${msg.model || 'ai'})`}
            </Text>
            {msg.tier && (
              <Text color="gray" dimColor>
                {' '}
                [{msg.tier}]
              </Text>
            )}
          </Box>
          <Box paddingLeft={2}>
            <Text wrap="wrap">{msg.content}</Text>
          </Box>
        </Box>
      ))}

      {isStreaming && (
        <Box flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            <Text bold color="blue">
              🤖 Assistant ({activeModel || 'routing...'})
            </Text>
            <Text color="yellow"> [streaming...]</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text wrap="wrap">{streamingContent}</Text>
            <Text color="blue"> ▍</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};
