import React from 'react';
import { Box, Text } from 'ink';
import { WorkIndicator } from './WorkIndicator.js';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  tier?: string;
  toolCalls?: ToolCallDisplay[];
}

export interface ToolCallDisplay {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  status: 'running' | 'completed' | 'failed';
  summary?: string;
}

export interface MessageStreamProps {
  messages: DisplayMessage[];
  streamingContent?: string;
  activeModel?: string;
  isStreaming?: boolean;
  activeWorkStatus?: string;
  activeTools?: ToolCallDisplay[];
}

export const MessageStream: React.FC<MessageStreamProps> = ({
  messages,
  streamingContent = '',
  activeModel,
  isStreaming = false,
  activeWorkStatus = 'Thinking...',
  activeTools = [],
}) => {
  return (
    <Box flexDirection="column" marginY={1}>
      {messages.map((msg) => (
        <Box key={msg.id} flexDirection="column" marginBottom={1}>
          <Box flexDirection="row">
            <Text
              bold
              color={msg.role === 'user' ? 'green' : msg.role === 'system' ? 'yellow' : 'blue'}
            >
              {msg.role === 'user'
                ? '👤 User'
                : msg.role === 'system'
                  ? '⚙ System'
                  : `🤖 Assistant (${msg.model || 'ai'})`}
            </Text>
            {msg.tier && (
              <Text color="gray" dimColor>
                {' '}
                [{msg.tier}]
              </Text>
            )}
          </Box>

          {/* Render past tool calls if any */}
          {msg.toolCalls && msg.toolCalls.length > 0 && (
            <Box flexDirection="column" paddingLeft={2} marginY={0}>
              {msg.toolCalls.map((tool) => (
                <Box key={tool.id} flexDirection="column">
                  <Box flexDirection="row">
                    <Text color="cyan">⚙ Tool [{tool.name}]: </Text>
                    <Text color="gray">{JSON.stringify(tool.args || {})}</Text>
                  </Box>
                  {tool.summary && (
                    <Box paddingLeft={2}>
                      <Text color="gray" dimColor>
                        ↳ {tool.summary}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

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
            <Text color="yellow"> [working...]</Text>
          </Box>

          {/* Active Tool Invocations */}
          {activeTools.length > 0 && (
            <Box flexDirection="column" paddingLeft={2} marginY={0}>
              {activeTools.map((tool) => (
                <Box key={tool.id} flexDirection="column">
                  <Box flexDirection="row">
                    <Text color="cyan">⚙ Tool [{tool.name}]: </Text>
                    <Text color="gray">{JSON.stringify(tool.args || {})}</Text>
                  </Box>
                  {tool.status === 'running' ? (
                    <Box paddingLeft={2}>
                      <WorkIndicator label={`Executing ${tool.name}...`} />
                    </Box>
                  ) : (
                    tool.summary && (
                      <Box paddingLeft={2}>
                        <Text color="gray" dimColor>
                          ↳ {tool.summary}
                        </Text>
                      </Box>
                    )
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Work Indicator if no tokens yet */}
          {!streamingContent && (
            <Box paddingLeft={2} marginY={0}>
              <WorkIndicator label={activeWorkStatus} />
            </Box>
          )}

          {/* Streaming token content */}
          {streamingContent ? (
            <Box paddingLeft={2}>
              <Text wrap="wrap">{streamingContent}</Text>
              <Text color="blue"> ▍</Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
};
